"use client";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white py-10 px-6 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {/* Our Company */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Our Company</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="#">About us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Partners</a></li>
          </ul>
        </div>

        {/* Useful Links */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Useful Links</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="#">Cart details</a></li>
            <li><a href="#">Find a store</a></li>
            <li><a href="#">Track order</a></li>
          </ul>
        </div>

        {/* Customer Support */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Customer Support</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="#">FAQs</a></li>
            <li><a href="#">Returns Policy</a></li>
            <li><a href="#">Shipping Information</a></li>
          </ul>
        </div>

        {/* Address */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Address</h2>
          <p className="text-sm leading-relaxed">
            KBB Park, Banglore Highway,<br />
            opposite Skoda Car Showroom,<br />
            Veerbhadra Nagar, Baner, Pune,<br />
            Maharashtra 411045
          </p>
          <p className="mt-4 text-sm">Phone number</p>
          <p className="text-sm">Website link</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
