"""
创建管理员用户脚本
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, engine
from app.models.user import User, Role
from app.core.security import get_password_hash

def create_admin():
    db = SessionLocal()
    try:
        # 检查是否已有 admin 角色
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin")
            db.add(admin_role)
            db.commit()
            print("[OK] Create admin role")
        else:
            print("[OK] Admin role exists")

        # 检查是否已有 admin 用户
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            print(f"[OK] Admin user exists (ID: {admin_user.id})")
            # 确保有 admin 角色
            if admin_role not in admin_user.roles:
                admin_user.roles.append(admin_role)
                db.commit()
                print("[OK] Added admin role to existing user")
        else:
            admin_user = User(
                username="admin",
                email="admin@example.com",
                password_hash=get_password_hash("admin123"),
                full_name="Administrator"
            )
            admin_user.roles.append(admin_role)
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"[OK] Created admin user")
            print(f"  Username: admin")
            print(f"  Password: admin123")
            print(f"  ID: {admin_user.id}")

        # 确保 annotator 角色也存在
        annotator_role = db.query(Role).filter(Role.name == "annotator").first()
        if not annotator_role:
            annotator_role = Role(name="annotator")
            db.add(annotator_role)
            db.commit()
            print("[OK] Create annotator role")

        print("\n[Done] Admin account created!")
        print("\nAdmin login:")
        print("  Username: admin")
        print("  Password: admin123")

    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
