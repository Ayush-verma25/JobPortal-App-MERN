import React, { useEffect, useState, useMemo } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Edit2, MoreHorizontal } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const CompaniesTable = () => {
    const { companies = [], searchCompanyByText = '' } = useSelector(store => store.company || {});
    const [filterCompany, setFilterCompany] = useState([]);
    const navigate = useNavigate();

    // Memoize filtered companies for better performance
    const filteredCompanies = useMemo(() => {
        if (!Array.isArray(companies)) return [];
        
        if (!searchCompanyByText) {
            return companies;
        }
        
        return companies.filter((company) => {
            // Safe access to company properties
            const companyName = company?.name || '';
            return companyName.toLowerCase().includes(searchCompanyByText.toLowerCase());
        });
    }, [companies, searchCompanyByText]);

    useEffect(() => {
        setFilterCompany(filteredCompanies);
    }, [filteredCompanies]);

    // Helper function to format date safely
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            console.warn('Invalid date format:', dateString);
            return 'Invalid Date';
        }
    };

    // Helper function to get company initials for avatar fallback
    const getCompanyInitials = (name) => {
        if (!name) return 'C';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    // Handle navigation with error handling
    const handleEditClick = (companyId) => {
        if (!companyId) {
            console.error('Company ID is missing');
            return;
        }
        try {
            navigate(`/admin/companies/${companyId}`);
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };

    // Loading state
    if (!companies) {
        return (
            <div className="flex justify-center items-center p-8">
                <p>Loading companies...</p>
            </div>
        );
    }

    // Empty state
    if (filterCompany.length === 0 && searchCompanyByText) {
        return (
            <div className="text-center p-8">
                <p>No companies found matching "{searchCompanyByText}"</p>
            </div>
        );
    }

    if (filterCompany.length === 0) {
        return (
            <div className="text-center p-8">
                <p>No companies registered yet.</p>
            </div>
        );
    }

    return (
        <div>
            <Table>
                <TableCaption>A list of your recent registered companies</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filterCompany.map((company, index) => (
                        <TableRow key={company._id || company.id || index}>
                            <TableCell>
                                <Avatar>
                                    <AvatarImage 
                                        src={company.logo} 
                                        alt={`${company.name || 'Company'} logo`}
                                    />
                                    <AvatarFallback>
                                        {getCompanyInitials(company.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell>
                                <span title={company.name}>
                                    {company.name || 'Unnamed Company'}
                                </span>
                            </TableCell>
                            <TableCell>{formatDate(company.createdAt)}</TableCell>
                            <TableCell className="text-right">
                                <Popover>
                                    <PopoverTrigger 
                                        className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                                        aria-label="More actions"
                                    >
                                        <MoreHorizontal />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-32">
                                        <div 
                                            onClick={() => handleEditClick(company._id || company.id)}
                                            className='flex items-center gap-2 w-fit cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors'
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleEditClick(company._id || company.id);
                                                }
                                            }}
                                        >
                                            <Edit2 className='w-4 h-4' />
                                            <span>Edit</span>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default CompaniesTable;