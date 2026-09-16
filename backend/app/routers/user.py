import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, Role, ADMIN_ROLE
from app.schemas.user import UserResponse, UserWithRoles
from app.routers.auth import get_current_user
from app.core.security import get_password_hash


router = APIRouter(prefix="/users", tags=["users"])


def require_role(roles: List[str]):
    """通用角色检查装饰器"""
    def checker(current_user: User = Depends(get_current_user)):
        user_roles = [r.name for r in current_user.roles]
        if not any(r in user_roles for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足"
            )
        return current_user
    return checker


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class RoleAssign(BaseModel):
    role_names: List[str]


class UserListResponse(BaseModel):
    items: List[UserWithRoles]
    total: int
    page: int
    page_size: int


@router.get("/roles", response_model=List[dict])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([ADMIN_ROLE]))
):
    """获取所有可用角色（仅管理员）"""
    roles = db.query(Role).all()
    return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]


@router.get("", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([ADMIN_ROLE]))
):
    """获取用户列表（仅管理员）"""
    query = db.query(User)
    if search:
        query = query.filter(
            (User.username.contains(search)) |
            (User.email.contains(search)) |
            (User.full_name.contains(search))
        )

    total = query.count()
    items = query.order_by(User.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()

    return UserListResponse(
        items=[UserWithRoles.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("", response_model=UserWithRoles)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([ADMIN_ROLE]))
):
    """创建新用户（仅管理员）"""
    # 检查用户名是否存在
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="用户名已存在")
    # 检查邮箱是否存在
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    # 创建用户
    user = User(
        id=str(uuid.uuid4()),
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 默认分配 annotator 角色
    annotator_role = db.query(Role).filter(Role.name == "annotator").first()
    if annotator_role:
        user.roles.append(annotator_role)
        db.commit()
        db.refresh(user)

    return user


@router.get("/{user_id}", response_model=UserWithRoles)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([ADMIN_ROLE]))
):
    """获取指定用户信息（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@router.put("/{user_id}", response_model=UserWithRoles)
def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([ADMIN_ROLE]))
):
    """更新用户信息（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if user_data.email is not None:
        # 检查邮箱是否被其他用户使用
        existing = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="邮箱已被其他用户使用")
        user.email = user_data.email

    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([ADMIN_ROLE]))
):
    """删除用户（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 不能删除自己
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="不能删除当前登录用户")

    db.delete(user)
    db.commit()
    return {"message": "用户已删除"}


@router.put("/{user_id}/roles", response_model=UserWithRoles)
def assign_roles(
    user_id: str,
    role_data: RoleAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([ADMIN_ROLE]))
):
    """为用户分配角色（仅管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 查询所有提供的角色名称
    roles = db.query(Role).filter(Role.name.in_(role_data.role_names)).all()
    if len(roles) != len(role_data.role_names):
        raise HTTPException(status_code=400, detail="部分角色不存在")

    # 替换用户的角色
    user.roles = roles
    db.commit()
    db.refresh(user)
    return user
