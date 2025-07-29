import React, { useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { COMPANY_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { setSingleCompany } from '@/redux/companySlice'

const CompanyCreate = () => {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    
    // Get user/auth data from Redux store
    const { user } = useSelector(store => store.auth);

    const registerNewCompany = async () => {
        // Validation
        if (!companyName.trim()) {
            toast.error('Company name is required');
            return;
        }

        // Check if user is authenticated
        if (!user) {
            toast.error('Please login to continue');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            // Get token from localStorage or cookies
            const token = localStorage.getItem('token') || 
                         document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

            if (!token) {
                toast.error('Authentication required. Please login again.');
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Add authorization header
                },
                withCredentials: true
            };

            const res = await axios.post(
                `${COMPANY_API_END_POINT}/register`, 
                { companyName: companyName.trim() }, 
                config
            );

            if (res?.data?.success) {
                dispatch(setSingleCompany(res.data.company));
                toast.success(res.data.message || 'Company created successfully');
                const companyId = res?.data?.company?._id;
                navigate(`/admin/companies/${companyId}`);
            }
        } catch (error) {
            console.error('Company creation error:', error);
            
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('token'); // Clear invalid token
                navigate('/login');
            } else if (error.response?.status === 403) {
                toast.error('Access denied. Insufficient permissions.');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to create company. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto'>
                <div className='my-10'>
                    <h1 className='font-bold text-2xl'>Your Company Name</h1>
                    <p className='text-gray-500'>What would you like to give your company name? You can change this later.</p>
                </div>

                <Label>Company Name</Label>
                <Input
                    type="text"
                    className="my-2"
                    placeholder="JobHunt, Microsoft etc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={loading}
                />
                <div className='flex items-center gap-2 my-10'>
                    <Button 
                        variant="outline" 
                        onClick={() => navigate("/admin/companies")}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={registerNewCompany}
                        disabled={loading || !companyName.trim()}
                    >
                        {loading ? 'Creating...' : 'Continue'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CompanyCreate;
