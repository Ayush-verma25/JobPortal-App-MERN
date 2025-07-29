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
    const [companyName, setCompanyName] = useState(''); // Initialize with empty string
    const [isLoading, setIsLoading] = useState(false); // Add loading state
    const dispatch = useDispatch();

    const registerNewCompany = async () => {
        // Input validation
        if (!companyName || companyName.trim() === '') {
            toast.error('Please enter a company name');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${COMPANY_API_END_POINT}/register`, 
                { companyName: companyName.trim() }, 
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true,
                    timeout: 10000 // Add timeout for better error handling
                }
            );

            if (res?.data?.success) {
                dispatch(setSingleCompany(res.data.company));
                toast.success(res.data.message);
                const companyId = res?.data?.company?._id;
                if (companyId) {
                    navigate(`/admin/companies/${companyId}`);
                } else {
                    toast.error('Company created but ID not found');
                    navigate('/admin/companies');
                }
            } else {
                toast.error(res?.data?.message || 'Failed to create company');
            }
        } catch (error) {
            console.error('Company creation error:', error);
            
            // Better error handling
            if (error.response) {
                const errorMessage = error.response?.data?.message || 'Server error occurred';
                toast.error(errorMessage);
            } else if (error.request) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleCancel = () => {
        navigate("/admin/companies");
    }

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto px-4'> {/* Add horizontal padding for mobile */}
                <div className='my-10'>
                    <h1 className='font-bold text-2xl'>Your Company Name</h1>
                    <p className='text-gray-500'>What would you like to give your company name? You can change this later.</p>
                </div>

                <div className='space-y-2'>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                        id="companyName"
                        type="text"
                        className="my-2"
                        placeholder="JobHunt, Microsoft etc."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={isLoading}
                        maxLength={100} // Add reasonable limit
                    />
                </div>
                
                <div className='flex items-center gap-2 my-10'>
                    <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={registerNewCompany}
                        disabled={isLoading || !companyName?.trim()}
                    >
                        {isLoading ? 'Creating...' : 'Continue'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CompanyCreate;
