import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { Send as SendIcon, User as UserIcon } from 'lucide-react';

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  profile_image?: string;
}

interface Message {
  id: number;
  sender: number;
  sender_name: string;
  sender_type: string;
  recipient: number;
  recipient_name: string;
  recipient_type: string;
  content: string;
  is_important: boolean;
  is_read: boolean;
  created_at: string;
  formatted_date: string;
}

interface ChatComponentProps {
  className?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ className }) => {
  const { token, user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Récupérer la liste des contacts
  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token]);

  // Récupérer les messages lorsqu'un contact est sélectionné
  useEffect(() => {
    if (token && selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [token, selectedContact]);

  // Faire défiler vers le bas lorsque de nouveaux messages sont chargés
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/contacts/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      } else {
        console.error('Failed to fetch contacts:', response.status);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contactId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/?recipient_id=${contactId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Failed to fetch messages:', response.status);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: selectedContact.id,
          content: newMessage,
          is_important: isImportant
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data]);
        setNewMessage('');
        setIsImportant(false);
      } else {
        console.error('Failed to send message:', response.status);
        alert('Échec de l\'envoi du message. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setMessages([]);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex h-full">
        {/* Liste des contacts */}
        <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-md font-medium text-gray-900">Contacts</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${
                  selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleContactSelect(contact)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {contact.profile_image ? (
                      <img
                        src={contact.profile_image.startsWith('http') 
                          ? contact.profile_image 
                          : `${API_BASE_URL}/media/${contact.profile_image}`}
                        alt={`${contact.first_name} ${contact.last_name}`}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contact.user_type === 'admin' ? 'Administrateur' : 
                       contact.user_type === 'employee' ? 'Employé' : 'Stagiaire'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Zone de chat */}
        <div className="w-3/4 flex flex-col">
          {selectedContact ? (
            <>
              {/* En-tête du chat */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {selectedContact.profile_image ? (
                      <img
                        src={selectedContact.profile_image.startsWith('http') 
                          ? selectedContact.profile_image 
                          : `${API_BASE_URL}/media/${selectedContact.profile_image}`}
                        alt={`${selectedContact.first_name} ${selectedContact.last_name}`}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-md font-medium text-gray-900">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedContact.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-gray-500">
                    Aucun message. Commencez la conversation !
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-3/4 p-3 rounded-lg ${
                            message.sender === user?.id
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-gray-100 text-gray-900'
                          } ${message.is_important ? 'border-2 border-red-500' : ''}`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {message.formatted_date}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center">
                  <TextArea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-1 mr-2"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="important"
                        checked={isImportant}
                        onChange={(e) => setIsImportant(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="important" className="text-sm text-gray-700">
                        Important
                      </label>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<SendIcon className="h-4 w-4" />}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      isLoading={sendingMessage}
                    >
                      Envoyer
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              Sélectionnez un contact pour commencer à discuter
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
