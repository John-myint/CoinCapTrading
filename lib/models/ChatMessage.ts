import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  conversationId: string; // the user's ID (all messages for a user share this)
  sender: 'user' | 'admin';
  senderName: string;
  text: string;
  attachments: {
    type: 'image' | 'video';
    name: string;
    data: string; // base64 data URL
    size: number; // bytes
  }[];
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    senderName: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'video'],
        },
        name: String,
        data: String,
        size: Number,
      },
    ],
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
chatMessageSchema.index({ conversationId: 1, createdAt: 1 });
chatMessageSchema.index({ sender: 1, read: 1 });

const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

export default ChatMessage;
