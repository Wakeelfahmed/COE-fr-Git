// src/components/GenericView.js
import React, { useState } from 'react';
import Table from './Table';
import Modal from './Modal';
import GenericForm from './GenericForm';

const GenericView = ({ title, schema, initialData }) => {
  const [data, setData] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    setData(data.filter((i) => i !== item));
  };

  const handleSubmit = (formData) => {
    if (editingItem) {
      setData(data.map((item) => (item === editingItem ? formData : item)));
    } else {
      setData([...data, formData]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New
        </button>
      </div>
      <Table data={data} schema={schema} onEdit={handleEdit} onDelete={handleDelete} />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'New Item'}
      >
        <GenericForm
          schema={schema}
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default GenericView;