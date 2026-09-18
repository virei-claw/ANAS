import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.dict import PartName, NoiseType, RoadType, DictType, DictTypeItem
from app.models.user import User
from app.schemas.dict import DictItemCreate, DictItemResponse, DictTypeCreate, DictTypeResponse, DictTypeItemCreate, DictTypeItemResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/dict", tags=["dict"])


def require_admin(current_user: User = Depends(get_current_user)):
    """检查用户是否有管理员权限"""
    if 'admin' not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return current_user

# Part Names
@router.get("/part-names", response_model=List[DictItemResponse])
def list_part_names(db: Session = Depends(get_db)):
    return db.query(PartName).all()

@router.post("/part-names", response_model=DictItemResponse)
def create_part_name(
    data: DictItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(PartName).filter(PartName.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    item = PartName(name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/part-names/{item_id}")
def delete_part_name(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(PartName).filter(PartName.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    # Clear references in annotations first
    from app.models.annotation import Annotation
    db.query(Annotation).filter(Annotation.part_name_id == item_id).update({"part_name_id": None})
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# Noise Types
@router.get("/noise-types", response_model=List[DictItemResponse])
def list_noise_types(db: Session = Depends(get_db)):
    return db.query(NoiseType).all()

@router.post("/noise-types", response_model=DictItemResponse)
def create_noise_type(
    data: DictItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(NoiseType).filter(NoiseType.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    item = NoiseType(name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/noise-types/{item_id}")
def delete_noise_type(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(NoiseType).filter(NoiseType.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    # Clear references in annotations first
    from app.models.annotation import Annotation
    db.query(Annotation).filter(Annotation.noise_type_id == item_id).update({"noise_type_id": None})
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# Road Types
@router.get("/road-types", response_model=List[DictItemResponse])
def list_road_types(db: Session = Depends(get_db)):
    return db.query(RoadType).all()

@router.post("/road-types", response_model=DictItemResponse)
def create_road_type(
    data: DictItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(RoadType).filter(RoadType.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    item = RoadType(name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/road-types/{item_id}")
def delete_road_type(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(RoadType).filter(RoadType.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    # Clear references in annotations first
    from app.models.annotation import Annotation
    db.query(Annotation).filter(Annotation.road_type_id == item_id).update({"road_type_id": None})
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}


# DictType CRUD APIs

@router.get("/types", response_model=List[DictTypeResponse])
def list_dict_types(db: Session = Depends(get_db)):
    """获取所有字典类型"""
    return db.query(DictType).all()


@router.post("/types", response_model=DictTypeResponse)
def create_dict_type(
    data: DictTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """创建新字典类型（仅管理员）"""
    existing = db.query(DictType).filter(DictType.type_code == data.type_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="字典类型已存在")
    item = DictType(type_name=data.type_name, type_code=data.type_code)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/types/{type_id}")
def delete_dict_type(
    type_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """删除字典类型（仅管理员），同时删除所有关联条目"""
    item = db.query(DictType).filter(DictType.id == type_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="字典类型不存在")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}


@router.get("/types/{type_id}/items", response_model=List[DictTypeItemResponse])
def list_dict_type_items(
    type_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """获取字典类型下的所有条目"""
    return db.query(DictTypeItem).filter(DictTypeItem.dict_type_id == type_id).all()


@router.post("/types/{type_id}/items", response_model=DictTypeItemResponse)
def create_dict_type_item(
    type_id: uuid.UUID,
    data: DictTypeItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """向字典类型添加条目（仅管理员）"""
    # 检查类型是否存在
    dict_type = db.query(DictType).filter(DictType.id == type_id).first()
    if not dict_type:
        raise HTTPException(status_code=404, detail="字典类型不存在")
    # 检查条目是否已存在
    existing = db.query(DictTypeItem).filter(
        DictTypeItem.dict_type_id == type_id,
        DictTypeItem.name == data.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="条目已存在")
    item = DictTypeItem(dict_type_id=type_id, name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/types/{type_id}/items/{item_id}")
def delete_dict_type_item(
    type_id: uuid.UUID,
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """删除字典条目（仅管理员）"""
    item = db.query(DictTypeItem).filter(
        DictTypeItem.id == item_id,
        DictTypeItem.dict_type_id == type_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="条目不存在")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}
