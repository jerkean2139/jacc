import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

export default function TestMessages() {
  const params = useParams();
  const chatId = params.id;

  console.log("TEST PAGE - Chat ID:", chatId);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: [`/api/public/chats/${chatId}/messages`],
    enabled: !!chatId,
    retry: false,
  });

  console.log("TEST PAGE - Messages:", { messages, isLoading, error });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {String(error)}</div>;
  if (!messages) return <div>No messages data</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Messages Page</h1>
      <div className="mb-4">
        <strong>Chat ID:</strong> {chatId}
      </div>
      <div className="mb-4">
        <strong>Messages Count:</strong> {Array.isArray(messages) ? messages.length : 'Not an array'}
      </div>
      
      {Array.isArray(messages) && messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message: any, index: number) => (
            <div key={message.id || index} className="border p-4 rounded">
              <div><strong>Role:</strong> {message.role}</div>
              <div><strong>Content:</strong> {message.content?.substring(0, 200)}...</div>
              <div><strong>ID:</strong> {message.id}</div>
              <div><strong>Keys:</strong> {Object.keys(message).join(', ')}</div>
            </div>
          ))}
        </div>
      ) : (
        <div>No messages to display</div>
      )}
    </div>
  );
}