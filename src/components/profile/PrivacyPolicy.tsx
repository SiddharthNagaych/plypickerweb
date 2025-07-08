// components/profile/PrivacyPolicy.tsx
"use client";

import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="prose max-w-none">
      <h2>Privacy Policy</h2>
      <p>We respect your privacy. This policy outlines what data we collect and how we use it.</p>
      <h3>What We Collect</h3>
      <ul>
        <li>Name, contact info, location data.</li>
        <li>Order and browsing history.</li>
      </ul>
      <h3>How We Use It</h3>
      <ul>
        <li>To improve user experience.</li>
        <li>To fulfill orders and provide support.</li>
      </ul>
    </div>
  );
};

export default PrivacyPolicy;