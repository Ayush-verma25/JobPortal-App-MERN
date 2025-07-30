import React, { useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { COMPANY_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { setSingleCompany } from '@/redux/companySlice'

const CompanyCreate = () => {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();

    const registerNewCompany = async () => {
        // Validation
        if (!companyName || companyName.trim() === '') {
            toast.error('Please enter a company name');
            return;
        }

        try {
            setIsLoading(true);
            
            // Get token from localStorage as backup
            const token = localStorage.getItem('authToken');
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
                timeout: 10000,
            };

            // Add Authorization header if token exists (for Vercel deployment)
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            const res = await axios.post(
                `${COMPANY_API_END_POINT}/register`, 
                { companyName: companyName.trim() }, 
                config
            );

            if (res?.data?.success) {
                dispatch(setSingleCompany(res.data.company));
                toast.success(res.data.message);
                const companyId = res?.data?.company?._id;
                navigate(`/admin/companies/${companyId}`);
            }
        } catch (error) {
            console.error('Company creation error:', error);
            
            // Better error handling
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data.message;
                
                if (status === 401) {
                    toast.error('Authentication required. Please log in again.');
                    // Clear stored token and redirect to login
                    localStorage.removeItem('authToken');
                    navigate('/login');
                } else if (status === 403) {
                    toast.error('You do not have permission to create companies.');
                } else {
                    toast.error(message || 'Failed to create company');
                }
            } else if (error.request) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto'>
                <div className='my-10'>
                    <h1 className='font-bold text-2xl'>Your Company Name</h1>
                    <p className='text-gray-500'>
                        What would you like to give your company name? You can change this later.
                    </p>
                </div>

                <Label>Company Name</Label>
                <Input
                    type="text"
                    className="my-2"
                    placeholder="JobHunt, Microsoft etc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                            registerNewCompany();
                        }
                    }}
                />
                
                <div className='flex items-center gap-2 my-10'>
                    <Button 
                        variant="outline" 
                        onClick={() => navigate("/admin/companies")}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={registerNewCompany}
                        disabled={isLoading || !companyName.trim()}
                    >
                        {isLoading ? 'Creating...' : 'Continue'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CompanyCreate
