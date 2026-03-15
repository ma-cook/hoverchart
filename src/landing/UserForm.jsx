// UserForm.jsx
import React from 'react';

const UserForm = ({ formData, handleFormChange, handleFormSubmit }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: '2rem',
        borderRadius: '15px',
        border: '2px solid white',
        zIndex: 20,
        boxShadow: '0 0 20px rgba(0,0,0,0.2)',
        color: 'white',
      }}
    >
      <form
        onSubmit={handleFormSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div>
          <label>
            Civilisation Name:
            <input
              type="text"
              name="civilisationName"
              value={formData.civilisationName}
              onChange={handleFormChange}
              required
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <div>
          <label>
            Home Planet Name:
            <input
              type="text"
              name="homePlanetName"
              value={formData.homePlanetName}
              onChange={handleFormChange}
              required
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <div>
          <label>
            Primary Color:
            <input
              type="color"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleFormChange}
              required
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <div>
          <label>
            Secondary Color:
            <input
              type="color"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={handleFormChange}
              required
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <button type="submit">Enter Universe</button>
      </form>
    </div>
  );
};

export default UserForm;
