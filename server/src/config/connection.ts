import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://tristanppersaud:Bigbigwinner@book-search.ht5qt.mongodb.net/?retryWrites=true&w=majority&appName=Book-Search');

export default mongoose.connection;
