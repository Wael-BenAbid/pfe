import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextInput,
  TextArea,
  FileInput,
  RadioGroup,
} from "../components/ui/FormElements";
import Button from "../components/ui/Button";
import {
  API_BASE_URL,
  APPLICATION_TYPES,
  VALIDATION_MESSAGES,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "../config/constants";
import { Briefcase as BriefcaseIcon, GraduationCap as GraduationCapIcon, User as UserIcon } from "lucide-react";
import logoImage from "../assets/images/logo.png";
import BackButton from "../components/ui/BackButton";

interface FormData {
  application_type: string;
  position: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  motivation: string;
  cv_file: File | null;
  github_profile: string;
  profile_image: File | null;
  password: string;
}

interface FormErrors {
  application_type?: string;
  position?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  education?: string;
  experience?: string;
  motivation?: string;
  cv_file?: string;
  github_profile?: string;
  profile_image?: string;
  password?: string;
}

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    application_type: "",
    position: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    education: "",
    experience: "",
    motivation: "",
    cv_file: null,
    github_profile: "",
    profile_image: null,
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.application_type) {
        newErrors.application_type = VALIDATION_MESSAGES.REQUIRED;
      }
      if (!formData.position) {
        newErrors.position = VALIDATION_MESSAGES.REQUIRED;
      }
    }

    if (step === 2) {
      if (!formData.first_name) {
        newErrors.first_name = VALIDATION_MESSAGES.REQUIRED;
      }
      if (!formData.last_name) {
        newErrors.last_name = VALIDATION_MESSAGES.REQUIRED;
      }
      if (!formData.email) {
        newErrors.email = VALIDATION_MESSAGES.REQUIRED;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = VALIDATION_MESSAGES.EMAIL_INVALID;
      }
      if (!formData.phone) {
        newErrors.phone = VALIDATION_MESSAGES.REQUIRED;
      }
      if (formData.github_profile && !/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(formData.github_profile)) {
        newErrors.github_profile = "Please enter a valid GitHub profile URL";
      }
      if (!formData.password) {
        newErrors.password = VALIDATION_MESSAGES.REQUIRED;
      } else if (formData.password.length < 8) {
        newErrors.password = VALIDATION_MESSAGES.PASSWORD_TOO_SHORT;
      }
    }

    if (step === 3) {
      if (!formData.education) {
        newErrors.education = VALIDATION_MESSAGES.REQUIRED;
      }
      if (!formData.experience && formData.application_type === "employee") {
        newErrors.experience = VALIDATION_MESSAGES.REQUIRED;
      }
      if (!formData.motivation) {
        newErrors.motivation = VALIDATION_MESSAGES.REQUIRED;
      }
    }

    if (step === 4) {
      if (!formData.cv_file) {
        newErrors.cv_file = VALIDATION_MESSAGES.FILE_REQUIRED;
      } else {
        if (formData.cv_file.size > MAX_FILE_SIZE) {
          newErrors.cv_file = VALIDATION_MESSAGES.FILE_SIZE_EXCEEDED;
        }
        if (!ACCEPTED_FILE_TYPES.includes(formData.cv_file.type)) {
          newErrors.cv_file = VALIDATION_MESSAGES.FILE_TYPE_INVALID;
        }
      }

      if (formData.profile_image) {
        if (formData.profile_image.size > MAX_FILE_SIZE) {
          newErrors.profile_image = VALIDATION_MESSAGES.FILE_SIZE_EXCEEDED;
        }
        if (!["image/jpeg", "image/png", "image/jpg"].includes(formData.profile_image.type)) {
          newErrors.profile_image = "Please upload a valid image file (JPEG, PNG)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, cv_file: file }));
    if (errors.cv_file) {
      setErrors((prev) => ({ ...prev, cv_file: undefined }));
    }
  };

  const handleProfileImageChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, profile_image: file }));
    if (errors.profile_image) {
      setErrors((prev) => ({ ...prev, profile_image: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if ((key === "cv_file" || key === "profile_image") && value) {
          submitData.append(key, value);
        } else if (key !== "cv_file" && key !== "profile_image") {
          submitData.append(key, value as string);
        }
      });

      const response = await fetch(`${API_BASE_URL}/job-applications/`, {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Submission failed");
      }

      navigate("/application-success");
    } catch (error) {
      console.error("Submission error:", error);
      alert("There was an error submitting your application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, label: "Application Type" },
      { number: 2, label: "Personal Info" },
      { number: 3, label: "Qualifications" },
      { number: 4, label: "Documents" },
    ];

    return (
      <div className="flex justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full
                ${
                  currentStep >= step.number
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }
                transition-colors duration-200
              `}
            >
              {step.number}
            </div>
            <div className="hidden sm:block ml-2 mr-8">
              <div
                className={`text-sm font-medium ${
                  currentStep >= step.number ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="hidden sm:block w-12 h-1 bg-gray-200 mr-4">
                <div
                  className={`h-1 bg-blue-600 transition-all duration-200`}
                  style={{ width: currentStep > step.number ? "100%" : "0%" }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Application Type
              </h2>
              <p className="text-gray-600">
                Please select the type of application you'd like to submit
              </p>
            </div>

            <RadioGroup
              label="Application Type"
              name="application_type"
              options={APPLICATION_TYPES}
              value={formData.application_type}
              onChange={(value) => handleChange("application_type", value)}
              error={errors.application_type}
              direction="vertical"
            />

            <TextInput
              label="Position"
              placeholder={`Enter the ${
                formData.application_type === "intern" ? "internship" : "job"
              } position you're applying for`}
              value={formData.position}
              onChange={(e) => handleChange("position", e.target.value)}
              error={errors.position}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Personal Information
              </h2>
              <p className="text-gray-600">
                Please provide your contact details
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="First Name"
                placeholder="Enter your first name"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                error={errors.first_name}
              />

              <TextInput
                label="Last Name"
                placeholder="Enter your last name"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                error={errors.last_name}
              />
            </div>

            <TextInput
              label="Email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
            />

            <TextInput
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              error={errors.phone}
            />

            <TextInput
              label="GitHub Profile"
              type="url"
              placeholder="Enter your GitHub profile URL (e.g., https://github.com/username)"
              value={formData.github_profile}
              onChange={(e) => handleChange("github_profile", e.target.value)}
              error={errors.github_profile}
              helper="Share your GitHub profile to showcase your projects"
            />

            <TextInput
              label="Password"
              type="password"
              placeholder="Create a password for your account"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              error={errors.password}
              helper="You'll use this password to log in if your application is approved"
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Qualifications
              </h2>
              <p className="text-gray-600">
                Tell us about your education and experience
              </p>
            </div>

            <TextArea
              label="Education"
              placeholder="Tell us about your educational background, degrees, certificates, etc."
              value={formData.education}
              onChange={(e) => handleChange("education", e.target.value)}
              error={errors.education}
            />

            <TextArea
              label="Experience"
              placeholder={
                formData.application_type === "intern"
                  ? "Tell us about any relevant experience (optional for internships)"
                  : "Tell us about your work experience, skills, and accomplishments"
              }
              value={formData.experience}
              onChange={(e) => handleChange("experience", e.target.value)}
              error={errors.experience}
            />

            <TextArea
              label="Motivation"
              placeholder={`Why are you interested in this ${
                formData.application_type === "intern"
                  ? "internship"
                  : "position"
              }?`}
              value={formData.motivation}
              onChange={(e) => handleChange("motivation", e.target.value)}
              error={errors.motivation}
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
              <p className="text-gray-600">Upload your resume/CV and profile image</p>
            </div>

            <FileInput
              label="Resume/CV"
              acceptedFileTypes={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
              error={errors.cv_file}
              helper="Upload your CV in PDF, DOC, or DOCX format (max 5MB)"
            />

            <FileInput
              label="Profile Image"
              acceptedFileTypes={["image/jpeg", "image/png", "image/jpg"]}
              onChange={handleProfileImageChange}
              error={errors.profile_image}
              helper="Upload a profile image (JPEG, PNG format, max 5MB)"
            />

            <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-100">
              <h3 className="text-md font-semibold text-blue-800 mb-2">
                What happens next?
              </h3>
              <p className="text-sm text-blue-700">
                After submission, your application will be reviewed by our HR
                team. If approved, you'll receive credentials to access your
                account. Until then, your status will remain pending.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (formData.application_type) {
      case "employee":
        return <BriefcaseIcon className="h-10 w-10 text-blue-600" />;
      case "intern":
        return <GraduationCapIcon className="h-10 w-10 text-blue-600" />;
      default:
        return <UserIcon className="h-10 w-10 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <BackButton to="/" label="Back to Home" />
            <div className="flex justify-center flex-grow">
              <img src={logoImage} alt="RH Management" className="h-16 w-auto" />
            </div>
            <div className="w-24"></div> {/* Espace pour équilibrer le bouton de retour */}
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {formData.application_type === "employee"
                ? "Job Application"
                : formData.application_type === "intern"
                ? "Internship Application"
                : "RH Management Application"}
            </h1>
            <p className="text-gray-600">
              Submit your application for review by our HR team
            </p>
          </div>
        </div>

        {renderStepIndicator()}

        <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={nextStep}
                  className="ml-auto"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  className="ml-auto"
                >
                  Submit Application
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
