"""
TDD: 测试管理员新增字典类型功能
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_token(client):
    """获取管理员 token"""
    response = client.post("/api/auth/login", data={"username": "adminuser", "password": "password123"})
    return response.json()["access_token"]


@pytest.fixture
def normal_token(client):
    """获取普通用户 token"""
    response = client.post("/api/auth/login", data={"username": "normaluser", "password": "password123"})
    return response.json()["access_token"]


class TestCreateDictType:
    """测试创建新的字典类型"""

    def test_admin_can_create_dict_type(self, client, admin_token):
        """管理员可以创建新的字典类型"""
        response = client.post(
            "/api/dict/types",
            json={"type_name": "test_type", "type_code": "test_type"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["type_name"] == "test_type"
        assert data["type_code"] == "test_type"
        assert "id" in data

    def test_normal_user_cannot_create_dict_type(self, client, normal_token):
        """普通用户不能创建新的字典类型"""
        response = client.post(
            "/api/dict/types",
            json={"type_name": "test_type", "type_code": "test_type"},
            headers={"Authorization": f"Bearer {normal_token}"}
        )
        assert response.status_code == 403

    def test_create_duplicate_dict_type_fails(self, client, admin_token):
        """创建重复的字典类型应该失败"""
        # 第一次创建
        client.post(
            "/api/dict/types",
            json={"type_name": "test_type", "type_code": "test_type"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # 第二次创建（重复）
        response = client.post(
            "/api/dict/types",
            json={"type_name": "test_type", "type_code": "test_type"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400


class TestListDictTypes:
    """测试获取字典类型列表"""

    def test_list_dict_types(self, client, admin_token):
        """获取所有字典类型"""
        # 先创建一个类型
        client.post(
            "/api/dict/types",
            json={"type_name": "test_type", "type_code": "test_type"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        response = client.get("/api/dict/types")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


class TestDeleteDictType:
    """测试删除字典类型"""

    def test_admin_can_delete_dict_type(self, client, admin_token):
        """管理员可以删除字典类型"""
        # 先创建一个类型
        create_resp = client.post(
            "/api/dict/types",
            json={"type_name": "to_delete", "type_code": "to_delete"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        type_id = create_resp.json()["id"]

        # 删除
        response = client.delete(
            f"/api/dict/types/{type_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200

    def test_normal_user_cannot_delete_dict_type(self, client, normal_token, admin_token):
        """普通用户不能删除字典类型"""
        # 先创建一个类型
        create_resp = client.post(
            "/api/dict/types",
            json={"type_name": "to_delete", "type_code": "to_delete"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        type_id = create_resp.json()["id"]

        # 普通用户尝试删除
        response = client.delete(
            f"/api/dict/types/{type_id}",
            headers={"Authorization": f"Bearer {normal_token}"}
        )
        assert response.status_code == 403


class TestDictTypeItems:
    """测试字典类型下的条目管理"""

    def test_admin_can_add_item_to_dict_type(self, client, admin_token):
        """管理员可以向字典类型添加条目"""
        # 先创建一个类型
        create_resp = client.post(
            "/api/dict/types",
            json={"type_name": "test_type", "type_code": "test_type"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        type_id = create_resp.json()["id"]

        # 添加条目
        response = client.post(
            f"/api/dict/types/{type_id}/items",
            json={"name": "test_item"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["name"] == "test_item"

    def test_list_items_in_dict_type(self, client, admin_token):
        """获取字典类型下的所有条目"""
        # 创建类型并添加条目
        create_resp = client.post(
            "/api/dict/types",
            json={"type_name": "test_type", "type_code": "test_type"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        type_id = create_resp.json()["id"]

        client.post(
            f"/api/dict/types/{type_id}/items",
            json={"name": "item1"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        response = client.get(f"/api/dict/types/{type_id}/items")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        assert len(items) >= 1

    def test_admin_can_delete_item(self, client, admin_token):
        """管理员可以删除字典条目"""
        # 创建类型和条目
        create_resp = client.post(
            "/api/dict/types",
            json={"type_name": "test_type", "type_code": "test_type"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        type_id = create_resp.json()["id"]

        item_resp = client.post(
            f"/api/dict/types/{type_id}/items",
            json={"name": "to_delete"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        item_id = item_resp.json()["id"]

        # 删除条目
        response = client.delete(
            f"/api/dict/types/{type_id}/items/{item_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
