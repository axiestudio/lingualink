import { MessageCircleIcon } from "lucide-react";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="size-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6">
        <MessageCircleIcon className="size-10 text-cyan-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-200 mb-2">Start Breaking Language Barriers</h3>
      <p className="text-slate-400 max-w-md">
        Choose a contact to start messaging with real-time translation. Communicate seamlessly across languages with Lingua Link.
      </p>
    </div>
  );
};

export default NoConversationPlaceholder;
