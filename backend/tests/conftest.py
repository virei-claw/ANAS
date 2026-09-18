import pytest
import sys
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# 测试数据库设置 - 使用内存 SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Import all models to ensure Base.metadata has all tables registered
from app.models import *  # noqa: F401, F403
from app.database import Base, get_db
from app.core.security import get_password_hash


def override_get_db():
    """覆盖数据库依赖，使用测试数据库"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables before running tests."""
    # 使用测试引擎创建表
    Base.metadata.create_all(bind=test_engine)
    yield
    # 测试结束后删除所有表
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    """每个测试前重建数据库表并配置依赖覆盖"""
    # 清空并重建所有表
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    # 覆盖依赖
    import app.main
    app.main.app.dependency_overrides[get_db] = override_get_db

    yield

    # 清理依赖覆盖
    app.main.app.dependency_overrides.clear()


@pytest.fixture(scope="function", autouse=True)
def setup_test_users():
    """创建测试用户（管理员和普通用户）"""
    db = TestingSessionLocal()

    # 创建 admin 角色
    admin_role = Role(id="role-admin-id", name="admin", description="管理员")
    annotator_role = Role(id="role-annotator-id", name="annotator", description="标注员")
    db.add(admin_role)
    db.add(annotator_role)

    # 创建普通用户
    normal_user = User(
        id="user-normal-id",
        username="normaluser",
        email="normal@test.com",
        password_hash=get_password_hash("password123"),
        is_active=True
    )
    normal_user.roles.append(annotator_role)

    # 创建管理员用户
    admin_user = User(
        id="user-admin-id",
        username="adminuser",
        email="admin@test.com",
        password_hash=get_password_hash("password123"),
        is_active=True
    )
    admin_user.roles.append(admin_role)

    db.add(normal_user)
    db.add(admin_user)
    db.commit()

    yield

    db.close()
