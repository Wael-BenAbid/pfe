import React, { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import {
  Send as SendIcon,
  User as UserIcon,
  File as FileIcon,
  Image as ImageIcon,
  FileText as FileTextIcon,
  Paperclip as PaperclipIcon
} from 'lucide-react';

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  profile_image?: string;
  is_supervisor?: boolean;
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
  attachment?: string;
  attachment_name?: string;
  attachment_type?: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/contacts/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Le backend filtre déjà les contacts, donc nous pouvons simplement les utiliser directement
        setContacts(data);

        // Si un contact est sélectionné mais n'est plus disponible, le désélectionner
        if (selectedContact && !data.some((contact: Contact) => contact.id === selectedContact.id)) {
          setSelectedContact(null);
          setMessages([]);
        }
      } else {
        console.error('Failed to fetch contacts:', response.status);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [token, selectedContact, setContacts, setSelectedContact, setMessages, setLoading]);

  const fetchMessages = useCallback(async (contactId: number) => {
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
  }, [token, setMessages, setLoading]);

  // Récupérer la liste des contacts
  useEffect(() => {
    if (token && user) {
      fetchContacts();
    }
  }, [token, user, fetchContacts]);

  // Récupérer les messages lorsqu'un contact est sélectionné
  useEffect(() => {
    if (token && selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [token, selectedContact, fetchMessages]);

  // Faire défiler vers le bas lorsque de nouveaux messages sont chargés
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleSendMessage = async () => {
    if (!selectedContact || (!newMessage.trim() && !selectedFile)) return;

    setSendingMessage(true);
    try {
      // Utiliser FormData pour envoyer à la fois le texte et le fichier
      const formData = new FormData();
      formData.append('recipient', selectedContact.id.toString());

      // Si seul un fichier est envoyé sans texte, ajouter un contenu par défaut
      if (!newMessage.trim() && selectedFile) {
        formData.append('content', `[Fichier joint: ${selectedFile.name}]`);
      } else {
        formData.append('content', newMessage);
      }

      formData.append('is_important', isImportant.toString());

      if (selectedFile) {
        formData.append('attachment', selectedFile);
        formData.append('attachment_name', selectedFile.name);
      }

      const response = await fetch(`${API_BASE_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data]);
        setNewMessage('');
        setIsImportant(false);
        setSelectedFile(null);
      } else {
        console.error('Failed to send message:', response.status);

        // Essayer de récupérer les détails de l'erreur
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
          alert(`Échec de l'envoi du message: ${JSON.stringify(errorData)}`);
        } catch {
          alert('Échec de l\'envoi du message. Veuillez réessayer.');
        }
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
            {user?.user_type === 'intern' && (
              <div className="mt-2 text-xs text-gray-700 bg-blue-100 p-3 rounded border border-blue-200">
                <p className="font-medium mb-1">Restrictions de messagerie :</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>En tant que stagiaire, vous pouvez uniquement contacter l'administrateur et votre encadrant.</li>
                  <li>Si vous ne voyez pas un contact dans la liste, c'est que vous n'êtes pas autorisé à lui envoyer des messages.</li>
                </ul>
              </div>
            )}
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
                          : contact.profile_image.startsWith('/media/')
                            ? `${API_BASE_URL}${contact.profile_image}`
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
                          : selectedContact.profile_image.startsWith('/media/')
                            ? `${API_BASE_URL}${selectedContact.profile_image}`
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

                          {message.attachment && (
                            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                              <div className="flex items-center">
                                {message.attachment_type?.includes('image') ? (
                                  <div className="mb-2">
                                    <ImageIcon className="h-4 w-4 mr-2 inline text-blue-500" />
                                    <a
                                      href={message.attachment.startsWith('http')
                                        ? message.attachment
                                        : `${API_BASE_URL}${message.attachment}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                      download={message.attachment_name || "image"}
                                    >
                                      {message.attachment_name || 'Image jointe'}
                                    </a>
                                    <div className="mt-2">
                                      <img
                                        src={message.attachment.startsWith('http')
                                          ? message.attachment
                                          : `${API_BASE_URL}${message.attachment}`}
                                        alt="Pièce jointe"
                                        className="max-w-full max-h-40 rounded cursor-pointer"
                                        onClick={() => {
                                          if (message.attachment) {
                                            const url = message.attachment.startsWith('http')
                                              ? message.attachment
                                              : `${API_BASE_URL}${message.attachment}`;
                                            window.open(url, '_blank');
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : message.attachment_type?.includes('pdf') ? (
                                  <div>
                                    <FileTextIcon className="h-4 w-4 mr-2 inline text-red-500" />
                                    <a
                                      href={message.attachment.startsWith('http')
                                        ? message.attachment
                                        : `${API_BASE_URL}${message.attachment}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                      download={message.attachment_name || "document.pdf"}
                                    >
                                      {message.attachment_name || 'PDF joint'}
                                    </a>
                                  </div>
                                ) : (
                                  <div>
                                    <FileIcon className="h-4 w-4 mr-2 inline text-gray-500" />
                                    <a
                                      href={message.attachment.startsWith('http')
                                        ? message.attachment
                                        : `${API_BASE_URL}${message.attachment}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                      download={message.attachment_name || "fichier"}
                                    >
                                      {message.attachment_name || 'Fichier joint'}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

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
                <div className="flex flex-col space-y-2">
                  {/* Fichier sélectionné */}
                  {selectedFile && (
                    <div className="text-sm text-gray-700 p-2 bg-blue-50 rounded-md flex items-center">
                      <FileIcon className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="truncate max-w-[300px]">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="ml-2 text-red-500 hover:text-red-700 bg-white rounded-full h-5 w-5 flex items-center justify-center"
                        aria-label="Supprimer le fichier"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div className="flex items-center">
                    <TextArea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Tapez votre message..."
                      className="flex-1 mr-2"
                      rows={2}
                      onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center bg-gray-50 p-1 rounded-md">
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

                      <div className="flex space-x-2">
                        {/* Bouton pour joindre un fichier */}
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<PaperclipIcon className="h-4 w-4" />}
                          onClick={handleOpenFileDialog}
                          title="Ajouter un fichier (image, PDF, Word)"
                          className="hover:bg-blue-50 border-blue-300 text-blue-600 hover:border-blue-400"
                        >
                          Joindre
                        </Button>

                        {/* Input file caché */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden" // Utiliser une classe Tailwind au lieu de style inline
                          accept="image/*,.pdf,.doc,.docx"
                          title="Sélectionner un fichier à envoyer"
                          aria-label="Sélectionner un fichier à envoyer"
                        />

                        {/* Bouton d'envoi */}
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<SendIcon className="h-4 w-4" />}
                          onClick={handleSendMessage}
                          disabled={(!newMessage.trim() && !selectedFile) || sendingMessage}
                          isLoading={sendingMessage}
                        >
                          Envoyer
                        </Button>
                      </div>
                    </div>
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
