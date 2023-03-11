function memoizedFetchPrefilter(requestOptions, ajaxOptions, jqXHR) {
  // Check if the request method is GET
  const isGetRequest = requestOptions.type && requestOptions.type.toLowerCase() === "get";
  // Check if the response should be cached
  const shouldCacheResponse = isGetRequest && requestOptions.cache !== false;

  // Nothing doing...
  if (!shouldCacheResponse && !storageAvailable('sessionStorage')) {
    return;
  }

  const CACHE_TIMEOUT = 60 * 60 * 1000; // 1 hour
  const LOCK_TIMEOUT = 60 * 1000; // 1 minute 

  const url = requestOptions.url;
  const cacheKey = `ajaxCache_${url}`;
  const lockKey = `ajaxLock_${url}`;

  // Acquire the lock for the URL
  const acquireLock = () => {
    const now = new Date().getTime();
    const acquired = sessionStorage.getItem(lockKey) || 0;
    if ((now - acquired) > LOCK_TIMEOUT) {
      sessionStorage.setItem(lockKey, now);
      return true;
    }
    return false;
  };

  // Release the lock for the URL
  const releaseLock = () => {
    sessionStorage.removeItem(lockKey);
  };

  // Check if the response is still valid based on the cache timeout
  const isValid = (response) => {
    const cacheTime = sessionStorage.getItem(cacheKey + "_time") || 0;
    return new Date().getTime() - cacheTime < CACHE_TIMEOUT && !!response;
  };

  // Retrieve the response from the cache
  const getCachedResponse = () => {
    const cachedResponse = sessionStorage.getItem(cacheKey);
    if (cachedResponse) {
      return JSON.parse(cachedResponse);
    }
    return null;
  };

  // Save the response to the cache
  const cacheResponse = (response) => {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(response));
      sessionStorage.setItem(cacheKey + "_time", new Date().getTime());
    }
    catch(err) {
      console.log("Failed to populate cache for '" + url + "' - session storage is likely full!")
    }
  };

  // Acquire the lock before making a request
  while(!acquireLock()) {
  }

  // Trying to get the result from the cache
  const cachedResponse = getCachedResponse();
  if (isValid(cachedResponse)) {
    // Aborting the old request
    jqXHR.abort();

    // Retrieving the results from the cache
    const response = cachedResponse.data;

    // Applying the results where needed
    if (isValid(ajaxOptions.success)) {
      ajaxOptions.success(response);
    }
    jqXHR.done = (doneFunc) => {
      doneFunc(response, "success", jqXHR)
    };

    // Exit point 1 - we're done here
    releaseLock();
    return;
  } else {
    // Remove the cached response if it is no longer valid
    sessionStorage.removeItem(cacheKey);
    sessionStorage.removeItem(cacheKey + "_time");
  }
  

  // Cache the response after a successful request
  // *NB* this injects the response into the cache, 
  // regardless if the success parameter is being used... 
  const originalSuccess = ajaxOptions.success;
  requestOptions.success = (response) => {

    cacheResponse({ data: response });
    releaseLock();

    if (originalSuccess) {
      originalSuccess(response);
    }
  };

  // Release the lock after a failed request
  const originalError = ajaxOptions.error;
  requestOptions.error = () => {
    releaseLock();

    if (isValid(originalError)) {
      originalError();
    }
  };
  // Exit point 2 - we've set up the ajax query to now cache its result.
  // The lock is still being held, because we haven't necessarily finished 
  // fetching the result
}

// Register the prefilter with jQuery
$.ajaxPrefilter(memoizedFetchPrefilter);
