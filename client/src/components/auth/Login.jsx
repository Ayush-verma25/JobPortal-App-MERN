import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { RadioGroup } from '../ui/radio-group'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { setLoading, setUser } from '@/redux/authSlice'
import { Loader2 } from 'lucide-react'

const Login = () => {
    const [input, setInput] = useState({
        email: "",
        password: "",
        role: "",
    });
    const { loading, user } = useSelector(store => store.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!input.email || !input.password || !input.role) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            dispatch(setLoading(true));
            const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
                headers: {
                    "Content-Type": "application/json"
                },
                withCredentials: true,
                // Add timeout for better error handling
                timeout: 10000,
            });
            
            if (res.data.success) {
                dispatch(setUser(res.data.user));
                
                // Store token in localStorage as backup for Vercel deployment
                if (res.data.token) {
                    localStorage.setItem('authToken', res.data.token);
                }
                
                toast.success(res.data.message);
                navigate("/");
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Better error handling
            if (error.response) {
                toast.error(error.response.data.message || 'Login failed');
            } else if (error.request) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('An unexpected error occurred');
            }
        } finally {
            dispatch(setLoading(false));
        }
    }

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate])

    return (
        <div>
            <Navbar />
            <div className='flex items-center justify-center max-w-7xl mx-auto'>
                <form onSubmit={submitHandler} className='w-1/2 border border-gray-200 rounded-md p-4 my-10'>
                    <h1 className='font-bold text-xl mb-5'>Login</h1>
                    
                    <div className='my-2'>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={input.email}
                            name="email"
                            onChange={changeEventHandler}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className='my-2'>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={input.password}
                            name="password"
                            onChange={changeEventHandler}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    
                    <div className='flex items-center justify-between'>
                        <RadioGroup className="flex items-center gap-4 my-5">
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="radio"
                                    name="role"
                                    value="student"
                                    checked={input.role === 'student'}
                                    onChange={changeEventHandler}
                                    className="cursor-pointer"
                                    id="student"
                                />
                                <Label htmlFor="student">Student</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="radio"
                                    name="role"
                                    value="recruiter"
                                    checked={input.role === 'recruiter'}
                                    onChange={changeEventHandler}
                                    className="cursor-pointer"
                                    id="recruiter"
                                />
                                <Label htmlFor="recruiter">Recruiter</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    
                    {loading ? (
                        <Button className="w-full my-4" disabled> 
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> 
                            Please wait 
                        </Button>
                    ) : (
                        <Button type="submit" className="w-full my-4">
                            Login
                        </Button>
                    )}
                    
                    <span className='text-sm'>
                        Don't have an account? 
                        <Link to="/signup" className='text-blue-600 ml-1'>Signup</Link>
                    </span>
                </form>
            </div>
        </div>
    )
}

export default Login
