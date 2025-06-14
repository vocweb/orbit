import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Government from './pages/Government';
import Residents from './pages/Residents';
import Business from './pages/Business';
import Parks from './pages/Parks';
import Transportation from './pages/Transportation';
import Elections from './pages/Elections';
import Budget from './pages/Budget';
import BusinessDirectory from './pages/BusinessDirectory';
import Parking from './pages/Parking';
import PropertyTaxes from './pages/PropertyTaxes';
import Contact from './pages/Contact';
import Employment from './pages/Employment';
import { useRef } from 'react';

// Function to generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to get or create session ID
function getSessionId(): string {
  const storageKey = 'orbit_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

declare global {
  interface Window {
    initChatbotWidget?: (config: {
      apiUrl: string,
      apiKey: string,
      sessionId?: string,
      containerSelector?: string,
      widgetConfig?: {
        header?: {
          title: string
        },
        welcome?: {
          title: string,
          description: string
        },
        suggestedQuestions?: Array<{
          text: string,
          query: string
        }>,
        theme?: {
          primary: string,
          secondary: string,
          background: string,
          text: {
            primary: string,
            secondary: string,
            inverse: string
          },
          input: {
            background: string,
            border: string
          },
          message: {
            user: string,
            assistant: string,
            userText: string
          },
          suggestedQuestions: {
            background: string,
            hoverBackground: string,
            text: string
          },
          chatButton: {
            background: string,
            hoverBackground: string
          },
          iconColor: string
        },
        icon?: string
      }
    }) => void;
    ChatbotWidget?: {
      updateWidgetConfig: (config: any) => void;
      setApiUrl: (apiUrl: string) => void;
      setApiKey: (apiKey: string) => void;
    };
  }
}

function App() {
  // Use a ref to track if the widget has been initialized
  const widgetInitialized = useRef(false);

  useEffect(() => {
    // Initialize the widget only once when component mounts
    if (typeof window !== 'undefined' && window.initChatbotWidget && !widgetInitialized.current) {
      console.log('Initializing chatbot widget...');
      
      try {
        const apiUrl = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000';
        const apiKey = import.meta.env.VITE_API_KEY || 'api_dummy_key';
        
        // Configure the API first
        if (window.ChatbotWidget) {
          window.ChatbotWidget.setApiUrl(apiUrl);
          window.ChatbotWidget.setApiKey(apiKey);
        }
        
        window.initChatbotWidget({
          apiUrl: apiUrl,
          apiKey: apiKey,
          sessionId: getSessionId(),
          containerSelector: '#chatbot-container',
          widgetConfig: {
            header: {
              title: "City of Maple Assistant"
            },
            welcome: {
              title: "Welcome to the City Services Assistant",
              description: "I am here to assist you with municipal services and information. I can help you with utility payments, permits, city services, and more. Please feel free to ask any questions about city operations and services."
            },
            suggestedQuestions: [
              {
                text: "Utility Bill Payment 💧",
                query: "How can I pay my water bill?"
              },
              {
                text: "Recycling Center Information ♻️",
                query: "Where can I find the city's recycling center?"
              },
              {
                text: "Pet Licensing 🐕",
                query: "How do I obtain a pet license?"
              },
              {
                text: "Report Infrastructure Issues 🚧",
                query: "How do I report a pothole in my neighborhood?"
              },
              {
                text: "Library Operating Hours 📚",
                query: "What are the hours for the public library?"
              },
              {
                text: "Waste Collection Schedule 🗑️",
                query: "What are the garbage collection days in my neighborhood?"
              }
            ],
            theme: {
              primary: '#1e3a8a',
              secondary: '#2563eb',
              background: '#ffffff',
              text: {
                primary: '#1f2937',
                secondary: '#6b7280',
                inverse: '#ffffff'
              },
              input: {
                background: '#f9fafb',
                border: '#d1d5db'
              },
              message: {
                user: '#1e3a8a',
                assistant: '#f8fafc',
                userText: '#ffffff'
              },
              suggestedQuestions: {
                background: '#eff6ff',
                hoverBackground: '#dbeafe',
                text: '#1e3a8a'
              },
              chatButton: {
                background: '#ffffff',
                hoverBackground: '#f3f4f6'
              },
              iconColor: '#2563eb'
            },
            icon: "message-square"
          }
        });
        widgetInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize chatbot widget:', error);
      }
    }
  }, []); // Empty dependency array ensures this runs only once
  
  return (
    <Router>
      <div id="chatbot-container"></div>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/government" element={<Government />} />
          <Route path="/residents" element={<Residents />} />
          <Route path="/business" element={<Business />} />
          <Route path="/parks" element={<Parks />} />
          <Route path="/transportation" element={<Transportation />} />
          <Route path="/government/elections" element={<Elections />} />
          <Route path="/government/budget" element={<Budget />} />
          <Route path="/business/directory" element={<BusinessDirectory />} />
          <Route path="/services/parking" element={<Parking />} />
          <Route path="/services/property-taxes" element={<PropertyTaxes />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/jobs" element={<Employment />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;