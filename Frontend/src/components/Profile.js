import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { UserCircle, Mail, Phone, Calendar, MapPin, Briefcase } from 'lucide-react';


axios.defaults.withCredentials = true;
const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/profile`);  // Updated endpoint
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!user) return <div className="flex justify-center items-center h-screen">No user data found</div>;

  return (
    <div className="bg-white min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-6">
          <div className="flex items-center">
            <UserCircle className="w-20 h-20 text-gray-700" />
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-900">{`${user.firstName} ${user.lastName}`}</h1>
              <p className="text-gray-600">{user.role}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="w-6 h-6 text-gray-500 mr-3" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-6 h-6 text-gray-500 mr-3" />
                <span>{user.contactNumber}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-gray-500 mr-3" />
                <span>{new Date(user.dateOfBirth).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-gray-500 mr-3" />
                <span>
                  {user.address.street}, {user.address.city}, {user.address.state} {user.address.zipCode}, {user.address.country}
                </span>
              </div>
              <div className="flex items-center">
                <Briefcase className="w-6 h-6 text-gray-500 mr-3" />
                <span>Joined on {new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;