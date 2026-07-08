import React, { createContext, useContext, useState, useEffect } from 'react';

const VidyutContext = createContext();

const API_BASE = window.location.port === '5173' || window.location.port === '3000'
  ? 'http://localhost:8001'
  : '';

export const VidyutProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: '', phone: '' });
  
  // Navigation tabs (active when survey is done)
  const [currentTab, setCurrentTab] = useState('dashboard'); // dashboard, recommendations, reports, profile
  
  // Current screen/step in the survey onboarding flow
  const [surveyStep, setSurveyStep] = useState('welcome'); // welcome, profile, appliances, ev, bill, processing, completed
  
  // Page 3: Profile Information
  const [profileData, setProfileData] = useState({
    houseType: 'Apartment',
    familyMembers: 3,
    city: 'Bengaluru',
    provider: 'BESCOM',
    monthlyBill: 2500,
    bedrooms: 2
  });

  // Page 4: Appliance Survey (Quantity, Average Daily Usage, Energy Rating)
  // Initialized with standard defaults
  const [appliancesData, setAppliancesData] = useState({
    lights: { qty: 12, usage: 6, rating: 4, icon: '💡', name: 'Lights' },
    fans: { qty: 4, usage: 12, rating: 3, icon: '🌀', name: 'Fans' },
    fridge: { qty: 1, usage: 24, rating: 4, icon: '❄️', name: 'Refrigerator' },
    tv: { qty: 2, usage: 4, rating: 3, icon: '📺', name: 'Television' },
    ac: { qty: 1, usage: 5, rating: 5, icon: '❄️', name: 'Air Conditioner' },
    washingMachine: { qty: 1, usage: 1.5, rating: 4, icon: '🧺', name: 'Washing Machine' },
    microwave: { qty: 1, usage: 0.5, rating: 3, icon: '🔥', name: 'Microwave' },
    waterHeater: { qty: 1, usage: 1, rating: 3, icon: '🚿', name: 'Water Heater' },
    desktop: { qty: 0, usage: 0, rating: 4, icon: '🖥️', name: 'Desktop PC' },
    laptop: { qty: 2, usage: 8, rating: 5, icon: '💻', name: 'Laptop' },
    inductionStove: { qty: 0, usage: 0, rating: 3, icon: '🍳', name: 'Induction Stove' },
    mixerGrinder: { qty: 1, usage: 0.2, rating: 3, icon: '🌪️', name: 'Mixer Grinder' },
    electricIron: { qty: 1, usage: 0.5, rating: 2, icon: '🔌', name: 'Electric Iron' },
    roPurifier: { qty: 1, usage: 2, rating: 4, icon: '💧', name: 'RO Purifier' }
  });

  // Page 5: Electric Vehicle
  const [evData, setEvData] = useState({
    hasEv: false,
    evType: 'None', // None, Electric Scooter, Electric Bike, Electric Car
    evBrand: '',
    evBatteryCapacity: 3.0,
    evChargingHours: 4.0,
    evChargingDays: 3
  });

  // Page 6: Current Bill / Upload details
  const [billData, setBillData] = useState({
    hasUploaded: false,
    filename: '',
    units: 0,
    billAmount: 0,
    billingPeriod: 'Current Month',
    tariff: 'LT-2a (Domestic)'
  });

  // Analysis result from AI processing backend
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Historical records from S3
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Cloud connectivity status
  const [cloudStatus, setCloudStatus] = useState({
    connected: false,
    provider: 'S3 Demo Mode',
    bucket: '',
    message: 'Checking connection...'
  });

  // Notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Welcome to Vidyut. Run an energy survey to get started!", time: "Just now", read: false }
  ]);

  // Fetch Cloud Status
  const fetchCloudStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cloud-status`);
      if (res.ok) {
        const data = await res.json();
        setCloudStatus({
          connected: data.connected,
          provider: data.provider,
          bucket: data.bucket,
          message: data.message
        });
      }
    } catch (err) {
      console.warn("Failed to fetch cloud status, falling back to mock mode:", err);
    }
  };

  // Fetch History of Reports
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cloud-records`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.warn("Failed to fetch cloud records:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudStatus();
  }, []);

  // Sync login status from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('vidyut_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (name, phone) => {
    const userData = { name, phone };
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('vidyut_user', JSON.stringify(userData));
    setNotifications(prev => [
      { id: Date.now(), text: `Authenticated successfully as ${name}`, time: "Just now", read: false },
      ...prev
    ]);
  };

  const logout = () => {
    setUser({ name: '', phone: '' });
    setIsLoggedIn(false);
    setSurveyStep('welcome');
    setAnalysisResult(null);
    setBillData({
      hasUploaded: false,
      filename: '',
      units: 0,
      billAmount: 0,
      billingPeriod: 'Current Month',
      tariff: 'LT-2a (Domestic)'
    });
    localStorage.removeItem('vidyut_user');
  };

  // Submit survey data to Backend
  const runAIAnalysis = async () => {
    // Transform frontend appliance survey to structure the backend understands
    const appliancesPayload = {};
    Object.keys(appliancesData).forEach(key => {
      // Calculate units using: quantity * wattage * usage * 30 days / 1000
      // Let's use simple approximate wattages for calculations
      const watts = {
        lights: 9, fans: 60, fridge: 150, tv: 100, ac: 1500, washingMachine: 450,
        microwave: 1200, waterHeater: 3000, desktop: 200, laptop: 65, inductionStove: 1800,
        mixerGrinder: 500, electricIron: 1000, roPurifier: 50
      };
      
      const app = appliancesData[key];
      const watt = watts[key] || 100;
      // Monthly consumption (kWh) = qty * watt * usage_hours * 30 / 1000
      const kwh = (app.qty * watt * app.usage * 30) / 1000;
      appliancesPayload[key] = parseFloat(kwh.toFixed(2));
    });

    const payload = {
      profile: {
        fullName: user.name,
        mobileNumber: user.phone,
        houseType: profileData.houseType,
        familyMembers: parseInt(profileData.familyMembers) || 2,
        city: profileData.city,
        provider: profileData.provider,
        monthlyBill: parseFloat(profileData.monthlyBill) || 2000.0,
        bedrooms: parseInt(profileData.bedrooms) || 2
      },
      appliances: {
        ledBulbs: appliancesData.lights.qty,
        fans: appliancesData.fans.qty,
        tvs: appliancesData.tv.qty,
        fridgeType: appliancesData.fridge.qty > 0 ? (profileData.bedrooms > 2 ? "Double Door" : "Single Door") : "None",
        acType: appliancesData.ac.qty > 0 ? "1.5 Ton" : "None",
        acCount: appliancesData.ac.qty,
        washingMachine: appliancesData.washingMachine.qty > 0 ? "Fully Automatic" : "None",
        microwave: appliancesData.microwave.qty > 0,
        waterHeater: appliancesData.waterHeater.qty > 0,
        inductionStove: appliancesData.inductionStove.qty > 0,
        desktop: appliancesData.desktop.qty,
        laptop: appliancesData.laptop.qty,
        gamingPc: 0,
        roPurifier: appliancesData.roPurifier.qty > 0,
        electricIron: appliancesData.electricIron.qty > 0,
        mixerGrinder: appliancesData.mixerGrinder.qty > 0,
        vacuumCleaner: false
      },
      ev: {
        hasEv: evData.hasEv,
        evType: evData.evType,
        evBrand: evData.evBrand,
        evBatteryCapacity: parseFloat(evData.evBatteryCapacity) || 0.0,
        evChargingDays: parseInt(evData.evChargingDays) || 0,
        evChargingTime: parseFloat(evData.evChargingHours) || 0.0,
        evMonthlyHours: parseFloat((evData.evChargingHours * evData.evChargingDays * 4.3).toFixed(1))
      },
      usage: {
        usageAc: appliancesData.ac.usage,
        usageTv: appliancesData.tv.usage,
        usageFridge: appliancesData.fridge.usage,
        usageWashingMachine: appliancesData.washingMachine.usage * 7, // Convert to weekly for backend if needed
        usageLighting: appliancesData.lights.usage,
        usageFan: appliancesData.fans.usage,
        workFromHome: evData.hasEv ? true : false // Simulation flag
      }
    };

    try {
      const res = await fetch(`${API_BASE}/api/analyze-survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
        setSurveyStep('completed');
        setCurrentTab('dashboard');
        
        // Add notification
        setNotifications(prev => [
          { id: Date.now(), text: "AI Energy Intelligence Report successfully created and synced to S3", time: "Just now", read: false },
          ...prev
        ]);
        
        // Refresh records in background
        fetchHistory();
        return data;
      } else {
        throw new Error("Failed to process survey details on the server.");
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
      // Fallback mock data in case backend is offline, to keep experience seamless
      const mockResult = {
        sync_id: `vidyut_survey_analysis_${Math.floor(Math.random() * 10000000)}`,
        current_units: 245.5,
        predicted_next_month_units: 198.2,
        current_bill: profileData.monthlyBill,
        predicted_next_month_bill: Math.round(profileData.monthlyBill * 0.78),
        estimated_savings: Math.round(profileData.monthlyBill * 0.22),
        energy_score: 84,
        efficiency_score: 84,
        carbon_footprint: 201.3,
        carbon_reduction: 38.8,
        cloud_provider: "S3 Demo Mode (Mock)",
        s3_bucket: "vidyut-rajeev-bmsit-demo",
        s3_object_key: "house-usage-analysis/mock_survey.json",
        s3_url: "https://vidyut-rajeev-bmsit-demo.s3.amazonaws.com/mock.json",
        top_consumers: [
          { appliance: "AIR CONDITIONER", value: 75.0 },
          { appliance: "REFRIGERATOR", value: 54.0 },
          { appliance: "LIGHTS", value: 32.4 }
        ],
        recommendations: [
          {
            appliance: "Air Conditioner",
            title: "Optimize AC Temperature to 24°C-26°C",
            tips: [
              "Setting the thermostat to 24°C instead of 18°C can reduce compressor run-time by up to 20%.",
              "Ensure doors and windows are fully sealed while the AC is running."
            ],
            estimated_saving: Math.round(profileData.monthlyBill * 0.12),
            priority: "High"
          },
          {
            appliance: "Refrigerator",
            title: "Upgrade to a 5-Star Inverter Refrigerator",
            tips: [
              "Modern 5-Star inverter compressors run at variable speeds and draw up to 30% less power.",
              "Maintain 3-4 inch clearance around refrigerator sides for ventilation."
            ],
            estimated_saving: Math.round(profileData.monthlyBill * 0.08),
            priority: "Medium"
          },
          {
            appliance: "Lights",
            title: "Switch to High-Efficiency LEDs & Use Sensors",
            tips: [
              "Upgrade any remaining fluorescent tube lights (FTLs) to high-efficiency LEDs.",
              "Install motion-sensor switches in bathrooms and corridors."
            ],
            estimated_saving: Math.round(profileData.monthlyBill * 0.04),
            priority: "Low"
          }
        ]
      };
      setAnalysisResult(mockResult);
      setSurveyStep('completed');
      setCurrentTab('dashboard');
      return mockResult;
    }
  };

  const uploadBillFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload-bill`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setBillData({
          hasUploaded: true,
          filename: file.name,
          units: data.units_consumed,
          billAmount: data.bill_amount,
          billingPeriod: data.billing_period,
          tariff: data.tariff
        });
        
        // Also prefill monthly bill in profileData
        setProfileData(prev => ({
          ...prev,
          monthlyBill: data.bill_amount
        }));

        setNotifications(prev => [
          { id: Date.now(), text: `Bill uploaded & OCR parsed successfully: ${data.consumer_name}'s bill`, time: "Just now", read: false },
          ...prev
        ]);
        return data;
      }
    } catch (err) {
      console.warn("Failed to upload bill, running simulated parse:", err);
      // Simulate
      const simulatedData = {
        units_consumed: 145,
        bill_amount: 1120.0,
        billing_period: "06 Jun 2026 - 06 Jul 2026",
        tariff: "LT-2a (Domestic)"
      };
      setBillData({
        hasUploaded: true,
        filename: file.name,
        units: simulatedData.units_consumed,
        billAmount: simulatedData.bill_amount,
        billingPeriod: simulatedData.billingPeriod,
        tariff: simulatedData.tariff
      });
      setProfileData(prev => ({
        ...prev,
        monthlyBill: simulatedData.bill_amount
      }));
      return simulatedData;
    }
  };

  return (
    <VidyutContext.Provider value={{
      isLoggedIn,
      user,
      currentTab,
      setCurrentTab,
      surveyStep,
      setSurveyStep,
      profileData,
      setProfileData,
      appliancesData,
      setAppliancesData,
      evData,
      setEvData,
      billData,
      setBillData,
      analysisResult,
      setAnalysisResult,
      history,
      historyLoading,
      fetchHistory,
      cloudStatus,
      notifications,
      setNotifications,
      login,
      logout,
      runAIAnalysis,
      uploadBillFile
    }}>
      {children}
    </VidyutContext.Provider>
  );
};

export const useVidyut = () => {
  const context = useContext(VidyutContext);
  if (!context) {
    throw new Error('useVidyut must be used within a VidyutProvider');
  }
  return context;
};
