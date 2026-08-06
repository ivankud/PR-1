// Главная страница со списком форм
import React from 'react';
import { useNavigate } from 'react-router-dom';
import FormMenu from './FormMenu';
import { useEditor } from '../state/EditorContext';
import { createEmptyForm } from '../utils/jsonUtils';

function HomePage() {
  const navigate = useNavigate();
  const { loadForm } = useEditor();

  const handleOpenForm = (formData) => {
    loadForm(formData);
    const id = formData?.id;
    navigate(`/editor/${encodeURIComponent(id)}`);
  };

  const handleCreateForm = () => {
    const newForm = createEmptyForm();
    loadForm(newForm);
    navigate('/editor');
  };

  const handlePreviewFromMenu = (formData) => {
    loadForm(formData);
    const id = formData?.id;
    navigate(`/forms/${encodeURIComponent(id)}`);
  };

  return (
    <FormMenu
      onOpenForm={handleOpenForm}
      onCreateForm={handleCreateForm}
      onPreviewForm={handlePreviewFromMenu}
    />
  );
}

export default HomePage;