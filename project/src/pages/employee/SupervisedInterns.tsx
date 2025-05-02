import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import { TextArea } from "../../components/ui/FormElements";
import { GraduationCapIcon } from "lucide-react";

interface Intern {
  id: number;
  intern_name: string;
  project: string;
  status: string;
  start_date: string;
  end_date: string;
  evaluation: string;
}

const SupervisedInterns: React.FC = () => {
  const { token } = useAuth();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true); // Etat de chargement
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [evaluation, setEvaluation] = useState("");

  useEffect(() => {
    fetchInterns();
  }, [token]);

  const fetchInterns = async () => {
    setLoading(true); // Début du chargement
    try {
      const response = await fetch(`${API_BASE_URL}/internships/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterns(data);
      }
    } catch (error) {
      console.error("Error fetching interns:", error);
    } finally {
      setLoading(false); // Fin du chargement
    }
  };

  const handleSubmitEvaluation = async (internId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/internships/${internId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ evaluation }),
      });

      if (response.ok) {
        fetchInterns();
        setShowEvaluationForm(false);
        setSelectedIntern(null);
        setEvaluation("");
      }
    } catch (error) {
      console.error("Error submitting evaluation:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Active
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        Supervised Interns
      </h2>

      {/* Affichage pendant le chargement */}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {interns.map((intern) => (
              <li key={intern.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <GraduationCapIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {intern.intern_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Project: {intern.project}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(intern.start_date).toLocaleDateString()} -{" "}
                        {new Date(intern.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(intern.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIntern(intern);
                        setShowEvaluationForm(true);
                        setEvaluation(intern.evaluation || "");
                      }}
                    >
                      Evaluate
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvaluationForm && selectedIntern && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Evaluate {selectedIntern.intern_name}
            </h3>
            <TextArea
              label="Evaluation"
              value={evaluation}
              onChange={(e) => setEvaluation(e.target.value)}
              placeholder="Enter your evaluation..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEvaluationForm(false);
                  setSelectedIntern(null);
                  setEvaluation("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSubmitEvaluation(selectedIntern.id)}
              >
                Submit Evaluation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisedInterns;
