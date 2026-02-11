import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen">
            <Sidebar />
            <main className="ml-64 min-h-screen transition-all duration-300">
                <div className="p-8 max-w-[1920px] mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
