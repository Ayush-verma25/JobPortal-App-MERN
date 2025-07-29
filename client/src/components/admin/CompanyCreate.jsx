import React, { useState, useEffect } from 'react'
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
    
    // Get user from Redux store to check authentication
    const { user } = useSelector(store => store.auth);

    // Check authentication on component mount
    useEffect(() => {
        if (!user) {
            toast.error('Please login to create a company');
            navigate('/login');
            return;
        }
    }, [user, navigate]);

    const registerNewCompany = async () => {
        // Validation
        if (!companyName || companyName.trim() === '') {
            toast.error('Please enter a company name');
            return;
        }

        if (!user) {
            toast.error('Authentication required. Please login again.');
            navigate('/login');
            return;
        }

        setLoading(true);
        
        try {
            // Get token from localStorage or Redux store
            const token = localStorage.getItem('token') || user?.token;
            
            const res = await axios.post(
                `${COMPANY_API_END_POINT}/register`, 
                { companyName: companyName.trim() }, 
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // Add authorization header
                    },
                    withCredentials: true
                }
            );

            if (res?.data?.success) {
                dispatch(setSingleCompany(res.data.company));
                toast.success(res.data.message);
                const companyId = res?.data?.company?._id;
                navigate(`/admin/companies/${companyId}`);
            }
        } catch (error) {
            console.error('Company creation error:', error);
            
            // Handle different error scenarios
            if (error.response?.status === 401) {
                toast.error('Authentication required. Please login again.');
                // Clear local storage and redirect to login
                localStorage.removeItem('token');
                navigate('/login');
            } else if (error.response?.status === 403) {
                toast.error('You do not have permission to create a company.');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.message === 'Network Error') {
                toast.error('Network error. Please check your connection and try again.');
            } else {
                toast.error('Failed to create company. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    // Show loading or redirect if not authenticated
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto px-4'>
                <div className='my-10'>
                    <h1 className='font-bold text-2xl'>Your Company Name</h1>
                    <p className='text-gray-500'>What would you like to give your company name? You can change this later.</p>
                </div>

                <div className='space-y-4'>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                        id="companyName"
                        type="text"
                        className="my-2"
                        placeholder="JobHunt, Microsoft etc."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={loading}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !loading) {
                                registerNewCompany();
                            }
                        }}
                    />
                </div>
                
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
