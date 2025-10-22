"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { useContract } from "@/lib/hooks/useContract";
import { useUserStore, usePredictionsStore } from "@/lib/store";
import { predictionApi, uploadApi } from "@/lib/api";
import type { TradeDirection } from "@/lib/types";
import { Loader2, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function PredictionForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [initialLiquidity, setInitialLiquidity] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [deadline, setDeadline] = useState("");
  const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState({ hours: 12, minutes: 0 });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { user } = useUserStore();
  const { addPrediction } = usePredictionsStore();
  const { createPrediction, isLoading: isContractLoading } = useContract();

  // Helper function to get minimum allowed time (1 hour from now)
  const getMinimumTime = () => {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return oneHourFromNow.toISOString().slice(0, 16);
  };

  // Date/Time picker helper functions
  const formatDateTime = (date: Date, time: { hours: number; minutes: number }) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(time.hours).padStart(2, '0');
    const minutes = String(time.minutes).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Disable dates before today
    return selectedDate < today;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // If today is selected, set default time to 1 hour from now
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      const oneHourFromNow = new Date(today.getTime() + 60 * 60 * 1000);
      setSelectedTime({
        hours: oneHourFromNow.getHours(),
        minutes: oneHourFromNow.getMinutes()
      });
    }
  };

  const handleTimeChange = (type: 'hours' | 'minutes', value: number) => {
    setSelectedTime(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleDateTimeConfirm = () => {
    if (selectedDate) {
      const dateTimeString = formatDateTime(selectedDate, selectedTime);
      setDeadline(dateTimeString);
      setShowDateTimePicker(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];

    // Validate file
    if (f) {
      // Check file size (limit to 10MB for images/videos)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (f.size > maxSize) {
        setError("File size too large. Maximum allowed size is 10MB.");
        return;
      }

      // Check file type
      const isImage = f.type.startsWith("image/");
      const isVideo = f.type.startsWith("video/");

      if (!isImage && !isVideo) {
        setError("Only image and video files are supported.");
        return;
      }

      setFile(f);
      setError(null);

      // Generate preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Please login first");
      return;
    }

    // Validate expiration time (must be at least 1 hour from now)
    const selectedTime = new Date(deadline);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now


    // Validate target price
    const targetPriceAmount = parseFloat(targetPrice);
    if (isNaN(targetPriceAmount) || targetPriceAmount <= 0) {
      setError("Target price must be a positive number");
      return;
    }

    // Validate initial liquidity
    // const liquidityAmount = parseFloat(initialLiquidity);
    // if (isNaN(liquidityAmount) || liquidityAmount <= 0) {
    //   setError("Initial liquidity must be a positive number");
    //   return;
    // }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload image/video if present
      let imageUrl = "";
      let uploadedFileKey = "";

      if (file) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadApi.uploadImage(file);

          if (!uploadResult.success) {
            throw new Error("Upload failed");
          }

          imageUrl = uploadResult.url;
          uploadedFileKey = uploadResult.key;

          console.log("File uploaded successfully:", {
            url: imageUrl,
            key: uploadedFileKey,
            size: uploadResult.size,
            type: uploadResult.fileType,
          });
        } catch (uploadError: any) {
          console.error("Upload error:", uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        } finally {
          setIsUploading(false);
        }
      }

      // 2. Create prediction on blockchain
      // Convert symbol to uppercase for contract (e.g., "BTCUSD", "ETHUSD")
      const pairName = symbol.toUpperCase().replace("/", "");
      const endTime = new Date(deadline);

      // TODO: This is a hook for blockchain integration
      // Uncomment when you have deployed contracts
      console.log("Initial liquidity:", initialLiquidity);
      console.log("Target price:", targetPriceAmount);
      console.log("End time:", endTime);
      console.log("Metadata URI:", JSON.stringify({ title, description, imageUrl }));
      console.log("Initial liquidity:", initialLiquidity);
      console.log("Target price:", targetPriceAmount);
      console.log("End time:", endTime);
      console.log("Metadata URI:", JSON.stringify({ title, description, imageUrl }));
      console.log("Initial liquidity:", initialLiquidity);
      const contractAddresses = await createPrediction({
        pairName,
        direction,
        targetPrice: BigInt(Math.floor(targetPriceAmount * 100000000)).toString(),
        endTime:    BigInt(Math.floor(endTime.getTime() / 1000)).toString(),
        metadataURI: JSON.stringify({ title, description, imageUrl }),
        initialLiquidity: BigInt(Math.floor(initialLiquidity * 1000000)).toString(),
      })



      // 3. Create prediction in database
      const prediction = await predictionApi.create({
        title,
        description,
        symbol,
        direction,
        entryPrice: undefined,
        targetPrice: targetPriceAmount,
        tradeImage: imageUrl,
        orderId: undefined, // No longer using orderId
        expiresAt: endTime,
        // @ts-ignore - we'll pass this along with creatorId
        creatorId: user.id,
        // @ts-ignore - we'll pass this too
        address: contractAddresses[0],
        yesTokenAddress: contractAddresses[1],
        noTokenAddress: contractAddresses[2],
      });

      // 4. Add to store
      addPrediction(prediction);

      // 5. Show success and reset form
      alert("✅ Prediction created successfully!");

      // Reset form
      setTitle("");
      setDescription("");
      setSymbol("");
      setTargetPrice("");
      setInitialLiquidity(0);
      setFile(null);
      setPreview(null);
      setDeadline("");
      setDirection("LONG");
      setError(null);
    } catch (err: any) {
      console.error("Error creating prediction:", err);
      setError(err.message || "Failed to create prediction");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const isLoading = isSubmitting || isContractLoading || isUploading;

  return (
    <form onSubmit={onSubmit} className="panel p-4 md:p-6 glow space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm text-foreground/80" htmlFor="title">
          Title *
        </label>
        <input
          id="title"
          className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Will BTC hit $75k by end of week?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-foreground/80" htmlFor="description">
          Description *
        </label>
        <textarea
          id="description"
          className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
          placeholder="Strong bullish momentum with institutional buying..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="symbol">
            Trading Pair *
          </label>
          <select
            id="symbol"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            required
            disabled={isLoading}
          >
            <option value="">Select a trading pair</option>
            <option value="1INCHUSD">1INCH/USD</option>
            <option value="AAVEUSD">AAVE/USD</option>
            <option value="BITCOINUSD">BITCOIN/USD</option>
            <option value="BNBUSD">BNB/USD</option>
            <option value="ETHUSD">ETH/USD</option>
          </select>
          <div className="text-xs text-foreground/60">
            Choose from supported trading pairs
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="direction">
            Direction *
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection("LONG")}
              disabled={isLoading}
              className={
                direction === "LONG"
                  ? "px-4 py-2 rounded-md bg-green-500 text-white flex-1"
                  : "px-4 py-2 rounded-md border border-border text-foreground/80 hover:text-green-500 flex-1"
              }
            >
              LONG ↑
            </button>
            <button
              type="button"
              onClick={() => setDirection("SHORT")}
              disabled={isLoading}
              className={
                direction === "SHORT"
                  ? "px-4 py-2 rounded-md bg-red-500 text-white flex-1"
                  : "px-4 py-2 rounded-md border border-border text-foreground/80 hover:text-red-500 flex-1"
              }
            >
              SHORT ↓
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-foreground/80" htmlFor="targetPrice">
          Target Price *
        </label>
        <input
          id="targetPrice"
          type="number"
          step="0.00000001"
          className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="75000"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          required
          disabled={isLoading}
        />
        <div className="text-xs text-foreground/60">
          The price target for your prediction
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="initialLiquidity">
            Initial Liquidity (PYUSD) *
          </label>
          <input
            id="initialLiquidity"
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="100.00"
            value={initialLiquidity}
            onChange={(e) => setInitialLiquidity(parseFloat(e.target.value))}
            required
            disabled={isLoading}
          />
          <div className="text-xs text-foreground/60">
            Amount of PYUSD to provide as initial liquidity
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-foreground/80" htmlFor="deadline">
            Expiration Date & Time *
          </label>
          <div className="relative">
            <input
              id="deadline"
              type="text"
              className="w-full rounded-md bg-background border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary pr-10 cursor-pointer"
              value={deadline ? new Date(deadline).toLocaleString() : ''}
              onClick={() => setShowDateTimePicker(true)}
              placeholder="Click to select date and time"
              required
              disabled={isLoading}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Calendar className="w-4 h-4 text-foreground/40" />
            </div>
          </div>
          <div className="text-xs text-foreground/60">
            When this prediction expires (minimum 1 hour from now)
            <br />
            <span className="text-primary">Earliest: {getMinimumTime().replace('T', ' ')}</span>
          </div>
          
          {/* Quick time presets */}
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                const time = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
                setDeadline(time.toISOString().slice(0, 16));
              }}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-background border border-border rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              1 Hour
            </button>
            <button
              type="button"
              onClick={() => {
                const time = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
                setDeadline(time.toISOString().slice(0, 16));
              }}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-background border border-border rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              6 Hours
            </button>
            <button
              type="button"
              onClick={() => {
                const time = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
                setDeadline(time.toISOString().slice(0, 16));
              }}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-background border border-border rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              1 Day
            </button>
            <button
              type="button"
              onClick={() => {
                const time = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
                setDeadline(time.toISOString().slice(0, 16));
              }}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-background border border-border rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              1 Week
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-foreground/80" htmlFor="image">
          Trade image/video (optional)
        </label>
        <input
          id="image"
          type="file"
          accept="image/*,video/*"
          onChange={onFile}
          className="block text-sm text-foreground/70"
          disabled={isLoading}
        />
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading file...</span>
          </div>
        )}
        {preview && !isUploading ? (
          <div className="mt-2 relative w-full h-48">
            {file?.type.startsWith("video/") ? (
              <video
                src={preview}
                controls
                className="w-full h-full rounded-md border border-border object-cover"
              />
            ) : (
              <Image
                src={preview}
                alt="Preview"
                fill
                className="rounded-md border border-border object-cover"
              />
            )}
          </div>
        ) : !isUploading ? (
          <div className="text-xs text-foreground/50">
            PNG, JPG, MP4, MOV up to 10MB.
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="text-xs text-foreground/60">* Required fields</div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isUploading
            ? "Uploading..."
            : isLoading
            ? "Creating..."
            : "Create Prediction"}
        </button>
      </div>

      <div className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3">
        💡 <strong>Smart Contract Integration:</strong> This form will deploy a prediction market contract, 
        initialize YES/NO tokens, and set up the market with your initial liquidity. Make sure you have 
        enough PYUSD tokens for the initial liquidity amount.
      </div>

      {/* Custom Date/Time Picker Modal */}
      {showDateTimePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Date & Time</h3>
                <button
                  onClick={() => setShowDateTimePicker(false)}
                  className="text-foreground/60 hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {/* Calendar */}
              <div className="mb-6">
                <div className="text-xs text-foreground/60 mb-2 text-center">
                  Select a date 
                </div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-background rounded"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h4 className="font-medium">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-background rounded"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-xs text-foreground/60 text-center py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}
                  {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                    const day = i + 1;
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const isDisabled = isDateDisabled(date);
                    const isSelected = selectedDate && 
                      selectedDate.getDate() === day && 
                      selectedDate.getMonth() === currentMonth.getMonth() &&
                      selectedDate.getFullYear() === currentMonth.getFullYear();
                    
                    // Check if this is today
                    const today = new Date();
                    const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear();
                    
                    return (
                      <button
                        key={day}
                        onClick={() => !isDisabled && handleDateSelect(date)}
                        disabled={isDisabled}
                        className={`h-8 text-sm rounded hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          isSelected ? 'bg-primary text-primary-foreground' : ''
                        } ${isToday && !isSelected ? 'ring-2 ring-primary/50 bg-primary/10' : ''}`}
                      >
                        {day}
                        {isToday && !isSelected && (
                          <span className="text-xs text-primary font-medium">•</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Time Picker */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Select Time</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-foreground/60 mb-1 block">Hours</label>
                    <select
                      value={selectedTime.hours}
                      onChange={(e) => handleTimeChange('hours', parseInt(e.target.value))}
                      className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-foreground/60 mb-1 block">Minutes</label>
                    <select
                      value={selectedTime.minutes}
                      onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value))}
                      className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDateTimePicker(false)}
                  className="flex-1 px-4 py-2 rounded-md border border-border hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDateTimeConfirm}
                  disabled={!selectedDate}
                  className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
