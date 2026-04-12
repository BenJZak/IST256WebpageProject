import { useMemo, useState } from 'react';
import { defaultMembers } from '../data/defaultData';

function getStoredMembers() {
  const savedMembers = localStorage.getItem('members');
  return savedMembers ? JSON.parse(savedMembers) : defaultMembers;
}

export default function MembersPage() {
  const [membersList, setMembersList] = useState(getStoredMembers);
  const [currentEditRow, setCurrentEditRow] = useState(-1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    year: '',
    affiliation: '',
    phone: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const submitLabel = useMemo(() => {
    return currentEditRow === -1 ? 'Add Member' : 'Update Member';
  }, [currentEditRow]);

  function saveMembers(nextMembers) {
    setMembersList(nextMembers);
    localStorage.setItem('members', JSON.stringify(nextMembers));
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });

    if (message.text) {
      setMessage({ text: '', type: '' });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      formData.name.trim() === '' ||
      formData.email.trim() === '' ||
      formData.year.trim() === '' ||
      formData.affiliation.trim() === ''
    ) {
      setMessage({ text: 'Please fill in all required fields.', type: 'danger' });
      return;
    }

    const emailPattern = /[a-zA-Z0-9._-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/;

    if (!emailPattern.test(formData.email.trim())) {
      setMessage({ text: 'Please enter a valid email address.', type: 'danger' });
      return;
    }

    const memberData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      year: formData.year.trim(),
      affiliation: formData.affiliation.trim(),
      phone: formData.phone.trim()
    };

    let nextMembers = [...membersList];

    if (currentEditRow === -1) {
      nextMembers.push(memberData);
    } else {
      nextMembers[currentEditRow] = memberData;
    }

    saveMembers(nextMembers);
    setFormData({ name: '', email: '', year: '', affiliation: '', phone: '' });
    setCurrentEditRow(-1);
    setMessage({ text: 'Member successfully saved!', type: 'success' });
  }

  function handleDelete(index) {
    const confirmDelete = window.confirm('Remove this member?');
    if (!confirmDelete) {
      return;
    }

    const nextMembers = membersList.filter((_, currentIndex) => currentIndex !== index);
    saveMembers(nextMembers);

    if (currentEditRow === index) {
      setCurrentEditRow(-1);
      setFormData({ name: '', email: '', year: '', affiliation: '', phone: '' });
    }
  }

  function handleEdit(index) {
    const selectedMember = membersList[index];
    setFormData(selectedMember);
    setCurrentEditRow(index);
    setMessage({ text: '', type: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="container py-5">
      <h2 className="mb-4">Member Registration</h2>

      {message.text && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-4 mb-4">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="name" className="form-label">Member Name *</label>
            <input type="text" className="form-control" id="name" name="name" value={formData.name} onChange={handleChange} />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="email" className="form-label">Email *</label>
            <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={handleChange} />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="year" className="form-label">Year / Age *</label>
            <input type="number" className="form-control" id="year" name="year" value={formData.year} onChange={handleChange} />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="affiliation" className="form-label">Institution / Organization *</label>
            <input type="text" className="form-control" id="affiliation" name="affiliation" value={formData.affiliation} onChange={handleChange} />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="phone" className="form-label">Phone (Optional)</label>
            <input type="text" className="form-control" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
        </div>

        <div>
          <button className="btn btn-success" type="submit">{submitLabel}</button>
        </div>
      </form>

      <h3>Member Directory</h3>
      <div className="table-responsive">
        <table className="table table-striped mt-3 bg-white">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Year</th>
              <th>Affiliation</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {membersList.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">No members added yet</td>
              </tr>
            ) : (
              membersList.map((item, index) => (
                <tr key={`${item.email}-${index}`}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.year}</td>
                  <td>{item.affiliation}</td>
                  <td>{item.phone || ''}</td>
                  <td>
                    <button className="btn btn-warning btn-sm me-2" type="button" onClick={() => handleEdit(index)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => handleDelete(index)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

