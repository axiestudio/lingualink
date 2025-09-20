import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, Zap } from "lucide-react";
import { useTranslationStore } from "../store/useTranslationStore";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);

  const { sendMessage, isSoundEnabled, selectedUser } = useChatStore();
  const { autoTranslateEnabled } = useTranslationStore();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    console.log("Sending message with image:", !!imagePreview);
    sendMessage({
      text: text.trim(),
      image: imagePreview,
    });
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);

    if (!file) {
      console.log("No file selected");
      return;
    }

    if (!file.type.startsWith("image/")) {
      console.log("Invalid file type:", file.type);
      toast.error("Please select an image file");
      return;
    }

    console.log("Processing image file:", file.name, file.type, file.size);
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("Image loaded, data length:", reader.result.length);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Get dynamic placeholder based on auto-translate status
  const getPlaceholder = () => {
    if (autoTranslateEnabled && selectedUser) {
      return `Type in any language... (auto-translates for ${selectedUser.fullName})`;
    }
    return "Type a message...";
  };

  return (
    <div className="p-4 border-t border-slate-700/50">
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex space-x-4">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
          }}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          placeholder={getPlaceholder()}
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => {
            console.log("Image button clicked");
            console.log("File input ref:", fileInputRef.current);
            fileInputRef.current?.click();
          }}
          className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${
            imagePreview ? "text-cyan-500" : ""
          }`}
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Auto-translate toggle button */}
        <button
          type="button"
          onClick={() => {
            const { setAutoTranslateEnabled } = useTranslationStore.getState();
            setAutoTranslateEnabled(!autoTranslateEnabled);
          }}
          className={`px-3 py-2 rounded-lg transition-all ${
            autoTranslateEnabled
              ? 'bg-cyan-500 text-white hover:bg-cyan-600'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
          title={autoTranslateEnabled ? 'Auto-translate enabled' : 'Auto-translate disabled'}
        >
          <Zap className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
export default MessageInput;
