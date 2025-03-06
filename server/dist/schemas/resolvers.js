import User from '../models/User.js';
import { signToken } from '../services/auth.js';
const resolvers = {
    Query: {
        // Fetch the current logged-in user's data
        me: async (_, __, { user }) => {
            if (!user)
                throw new Error('Not authenticated');
            return await User.findById(user._id).populate('savedBooks');
        },
    },
    Mutation: {
        // Login user and return token and user data
        login: async (_, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user)
                throw new Error('No user found with that email');
            const valid = await user.isCorrectPassword(password);
            if (!valid)
                throw new Error('Incorrect password');
            const token = signToken(user.username, user.email, user._id);
            return { token, user };
        },
        // Create a new user
        addUser: async (_, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user.username, user.email, user._id);
            return { token, user };
        },
        // Save a book to the user's saved books list
        saveBook: async (_, { bookId, authors, description, title, image, link }, { user }) => {
            if (!user)
                throw new Error('Not authenticated');
            const book = { bookId, authors, description, title, image, link };
            const updatedUser = await User.findByIdAndUpdate(user._id, { $addToSet: { savedBooks: book } }, // Add book to savedBooks array
            { new: true });
            return updatedUser;
        },
        // Remove a book from the user's saved books list
        removeBook: async (_, { bookId }, { user }) => {
            if (!user)
                throw new Error('Not authenticated');
            const updatedUser = await User.findByIdAndUpdate(user._id, { $pull: { savedBooks: { bookId } } }, // Remove the book by bookId
            { new: true });
            return updatedUser;
        },
    },
};
export default resolvers;
