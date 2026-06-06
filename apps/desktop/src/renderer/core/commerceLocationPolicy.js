(function(){
  const LOCATION_POLICY_KEY = "weishan:commerceLocationPolicy:v1";
  const PRIVACY_NOTICE = "为了精准计算最低到手价并遵守当地法律，请开启定位权限。weishan 仅将定位用于价格、运费、税费、关税和合规区域计算，不会保存原始位置。";

  function storage(){
    try { return window.localStorage || null; } catch (_) { return null; }
  }

  function modeValue(value){
    const raw = String(value || "");
    return /^(off|while_using_app|always)$/.test(raw) ? raw : "off";
  }

  function statusValue(value){
    const raw = String(value || "");
    return /^(not_requested|granted|denied|unavailable|error)$/.test(raw) ? raw : "not_requested";
  }

  function defaultPrivacy(){
    return {
      storeRawCoordinates:false,
      logRawCoordinates:false,
      shareWithThirdParty:false,
      useForAds:false,
      useForTracking:false
    };
  }

  function createCommerceLocationPolicy(input){
    const source = input || {};
    const mode = modeValue(source.locationPermissionMode);
    const status = statusValue(source.locationPermissionStatus);
    const hasPreciseLocation = mode !== "off" && status === "granted" && source.hasPreciseLocation === true;
    const canCalculate = hasPreciseLocation === true;
    return {
      locationPermissionMode:mode,
      locationPermissionStatus:status,
      locationRequiredForAccuratePrice:true,
      hasPreciseLocation,
      canCalculateAccurateLandedCost:canCalculate,
      canShowAccuratePrice:canCalculate,
      canShowRedirectButton:canCalculate,
      reason:canCalculate ? "location_ready" : "location_required",
      privacy:defaultPrivacy(),
      notice:PRIVACY_NOTICE,
      rawCoordinatesStored:false,
      rawCoordinatesLogged:false,
      thirdPartyUpload:false,
      createdAt:source.createdAt || "",
      updatedAt:source.updatedAt || ""
    };
  }

  function getCommerceLocationPolicy(){
    const s = storage();
    let saved = {};
    try { saved = s ? JSON.parse(s.getItem(LOCATION_POLICY_KEY) || "{}") : {}; } catch (_) { saved = {}; }
    return createCommerceLocationPolicy(saved);
  }

  function saveCommerceLocationPolicy(input){
    const current = getCommerceLocationPolicy();
    const next = createCommerceLocationPolicy(Object.assign({}, current, input || {}, { updatedAt:new Date().toISOString() }));
    const persisted = {
      locationPermissionMode:next.locationPermissionMode,
      locationPermissionStatus:next.locationPermissionStatus,
      hasPreciseLocation:next.hasPreciseLocation === true,
      updatedAt:next.updatedAt
    };
    const s = storage();
    try { if (s) s.setItem(LOCATION_POLICY_KEY, JSON.stringify(persisted)); } catch (_) {}
    return next;
  }

  function locationHealthForCommerce(input){
    const policy = createCommerceLocationPolicy(input || getCommerceLocationPolicy());
    return Object.assign({}, policy, {
      searchStatus:policy.canCalculateAccurateLandedCost ? "ready" : "location_required",
      canShowPrice:policy.canShowAccuratePrice === true,
      canShowBookingButton:policy.canShowRedirectButton === true,
      canShowCheckoutButton:policy.canShowRedirectButton === true,
      landedCostAccuracy:policy.canCalculateAccurateLandedCost ? "location_ready" : "blocked_location_required",
      reason:policy.canCalculateAccurateLandedCost ? "location_ready" : "location_required_for_accurate_landed_cost"
    });
  }

  function requestCommerceLocationPermission(){
    const current = getCommerceLocationPolicy();
    if (current.locationPermissionMode === "off") {
      return Promise.resolve(locationHealthForCommerce(Object.assign({}, current, { locationPermissionStatus:"denied", hasPreciseLocation:false })));
    }
    if (typeof navigator === "undefined" || !navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== "function") {
      return Promise.resolve(saveCommerceLocationPolicy({ locationPermissionStatus:"unavailable", hasPreciseLocation:false }));
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(function(){
        resolve(saveCommerceLocationPolicy({ locationPermissionStatus:"granted", hasPreciseLocation:true }));
      }, function(){
        resolve(saveCommerceLocationPolicy({ locationPermissionStatus:"denied", hasPreciseLocation:false }));
      }, { enableHighAccuracy:false, maximumAge:0, timeout:5000 });
    }).then(locationHealthForCommerce);
  }

  window.WeishanCommerceLocationPolicy = {
    LOCATION_POLICY_KEY,
    PRIVACY_NOTICE,
    createCommerceLocationPolicy,
    getCommerceLocationPolicy,
    saveCommerceLocationPolicy,
    locationHealthForCommerce,
    requestCommerceLocationPermission
  };
})();
