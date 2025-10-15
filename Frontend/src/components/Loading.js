import React from 'react';

const Loading = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-50 z-50">
      <div className="bg-transparent p-8 rounded-lg flex flex-col items-center">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24 mb-4">
          <style jsx>{`
            .loader {
              border-top-color: #3b82f6; /* blue-500 */
              -webkit-animation: spinner 1.5s linear infinite;
              animation: spinner 1.5s linear infinite;
            }
            @-webkit-keyframes spinner {
              0% { -webkit-transform: rotate(0deg); }
              100% { -webkit-transform: rotate(360deg); }
            }
            @keyframes spinner {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        <h2 className="text-center text-2xl font-semibold text-gray-700 mb-2">Loading...</h2>
        {/* <p className="w-64 text-center text-gray-600">Please wait while we prepare your dashboard.</p> */}
      </div>
    </div>
  );
};

export default Loading;