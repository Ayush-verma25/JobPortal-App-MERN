import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const PostJob = () => {
  const [input, setInput] = useState({
    title: "",
    description: "",
    requirements: "",
    salary: "",
    location: "",
    jobType: "",
    experience: "",
    position: 1, // Changed from 0 to 1 as default
    companyId: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const { companies } = useSelector((store) => store.company);

  // Form validation function
  const validateForm = () => {
    const newErrors = {};

    if (!input.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!input.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!input.requirements.trim()) {
      newErrors.requirements = "Requirements are required";
    }

    if (!input.salary.trim()) {
      newErrors.salary = "Salary is required";
    }

    if (!input.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!input.jobType.trim()) {
      newErrors.jobType = "Job type is required";
    }

    if (!input.experience.trim()) {
      newErrors.experience = "Experience level is required";
    }

    if (!input.position || input.position < 1) {
      newErrors.position = "Number of positions must be at least 1";
    }

    if (!input.companyId) {
      newErrors.companyId = "Please select a company";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const changeEventHandler = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const selectChangeHandler = (value) => {
    const selectedCompany = companies.find(
      (company) => company.name.toLowerCase() === value
    );

    if (selectedCompany) {
      setInput((prev) => ({ ...prev, companyId: selectedCompany._id }));

      // Clear company selection error
      if (errors.companyId) {
        setErrors((prev) => ({ ...prev, companyId: "" }));
      }
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${JOB_API_END_POINT}/post`, input, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/admin/jobs");
      }
    } catch (error) {
      console.error("Error posting job:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred while posting the job";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Don't render form if no companies are available
  if (!companies || companies.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="flex items-center justify-center w-screen my-5">
          <div className="p-8 max-w-4xl border border-gray-200 shadow-lg rounded-md text-center">
            <p className="text-lg text-red-600 font-bold mb-4">
              No companies available
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Please register a company first before posting jobs
            </p>
            <Button
              onClick={() => navigate("/admin/companies")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Register Company
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center w-screen my-5 px-4">
        <form
          onSubmit={submitHandler}
          className="p-8 w-full max-w-4xl border border-gray-200 shadow-lg rounded-md"
        >
          <h1 className="text-2xl font-bold mb-6 text-center">Post New Job</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                name="title"
                value={input.title}
                onChange={changeEventHandler}
                className={`focus-visible:ring-offset-0 focus-visible:ring-0 my-1 ${
                  errors.title ? "border-red-500" : ""
                }`}
                placeholder="Enter job title"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                type="text"
                name="description"
                value={input.description}
                onChange={changeEventHandler}
                className={`focus-visible:ring-offset-0 focus-visible:ring-0 my-1 ${
                  errors.description ? "border-red-500" : ""
                }`}
                placeholder="Enter job description"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="requirements">Requirements *</Label>
              <Input
                id="requirements"
                type="text"
                name="requirements"
                value={input.requirements}
                onChange={changeEventHandler}
                className={`focus-visible:ring-offset-0 focus-visible:ring-0 my-1 ${
                  errors.requirements ? "border-red-500" : ""
                }`}
                placeholder="Enter job requirements"
              />
              {errors.requirements && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.requirements}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="salary">Salary *</Label>
              <Input
                id="salary"
                type="text"
                name="salary"
                value={input.salary}
                onChange={changeEventHandler}
                className={`focus-visible:ring-offset-0 focus-visible:ring-0 my-1 ${
                  errors.salary ? "border-red-500" : ""
                }`}
                placeholder="Enter salary range"
              />
              {errors.salary && (
                <p className="text-red-500 text-xs mt-1">{errors.salary}</p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                type="text"
                name="location"
                value={input.location}
                onChange={changeEventHandler}
                className={`focus-visible:ring-offset-0 focus-visible:ring-0 my-1 ${
                  errors.location ? "border-red-500" : ""
                }`}
                placeholder="Enter job location"
              />
              {errors.location && (
                <p className="text-red-500 text-xs mt-1">{errors.location}</p>
              )}
            </div>

            <div>
              <Label htmlFor="jobType">Job Type *</Label>
              <Input
                id="jobType"
                type="text"
                name="jobType"
                value={input.jobType}
                onChange={changeEventHandler}
                className={`focus-visible:ring-offset-0 focus-visible:ring-0 my-1 ${
                  errors.jobType ? "border-red-500" : ""
                }`}
                placeholder="e.g. Full-time, Part-time, Contract"
              />
              {errors.jobType && (
                <p className="text-red-500 text-xs mt-1">{errors.jobType}</p>
              )}
            </div>

            <div>
              <Label htmlFor="experience">Experience Level *</Label>
              <Input
                id="experience"
                type="text"
                name="experience"
                value={input.experience}
                onChange={changeEventHandler}
                className={`focus-visible:ring-offset-0 focus-visible:ring-0 my-1 ${
                  errors.experience ? "border-red-500" : ""
                }`}
                placeholder="e.g. Entry, Mid, Senior"
              />
              {errors.experience && (
                <p className="text-red-500 text-xs mt-1">{errors.experience}</p>
              )}
            </div>

            <div>
              <Label htmlFor="position">Number of Positions *</Label>
              <Input
                id="position"
                type="number"
                name="position"
                min="1"
                value={input.position}
                onChange={changeEventHandler}
                className={`focus-visible:ring-offset-0 focus-visible:ring-0 my-1 ${
                  errors.position ? "border-red-500" : ""
                }`}
                placeholder="Enter number of positions"
              />
              {errors.position && (
                <p className="text-red-500 text-xs mt-1">{errors.position}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label>Select Company *</Label>
              <Select onValueChange={selectChangeHandler}>
                <SelectTrigger
                  className={`w-full my-1 ${
                    errors.companyId ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select a Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {companies.map((company) => (
                      <SelectItem
                        key={company._id}
                        value={company?.name?.toLowerCase()}
                      >
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.companyId && (
                <p className="text-red-500 text-xs mt-1">{errors.companyId}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button type="submit" className="w-full">
                Post New Job
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
