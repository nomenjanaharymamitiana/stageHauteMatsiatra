from sqlalchemy import Column, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Document(Base):
    __tablename__ = "documents"

    num_ref = Column(String(100), primary_key=True, index=True)
    date_num = Column(Date, nullable=False)
    format = Column(String(20), nullable=False)
    cat = Column(String(100), nullable=False)
    annee_redac = Column(Date, nullable=False)

    title = Column(String(255), nullable=False, default="Sans titre")
    file_path = Column(String(500), nullable=False)

    im_dag_rh = Column(String(50), ForeignKey("dag_rh.im"), nullable=True)
    dag_rh_rel = relationship("DAG_RH", back_populates="documents")

    journals = relationship("Journal", back_populates="document")