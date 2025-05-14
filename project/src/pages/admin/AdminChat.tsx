import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChatComponent from '../../components/chat/ChatComponent';
import Button from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const AdminChat: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Messagerie</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/admine')}
          icon={<ArrowLeft className="h-4 w-4 mr-2" />}
        >
          Retour
        </Button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden h-[calc(100vh-200px)]">
        <ChatComponent />
      </div>
    </div>
  );
};

export default AdminChat;
