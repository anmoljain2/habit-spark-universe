import React from 'react';

const Relationship: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="bg-white/80 rounded-2xl shadow-xl p-10 flex flex-col items-center">
        <span className="text-5xl mb-4">💞</span>
        <h1 className="text-3xl font-bold text-pink-700 mb-2">Relationship</h1>
        <p className="text-lg text-gray-700 mb-2 text-center max-w-md">
          <span className="font-semibold text-purple-600">Manage your effective communication</span> <br />
          <span className="font-semibold text-pink-500">with data and generosity.</span>
        </p>
        <span className="mt-4 text-base text-gray-400 italic">Coming Soon</span>
      </div>
    </div>
  );
};

export default Relationship; 