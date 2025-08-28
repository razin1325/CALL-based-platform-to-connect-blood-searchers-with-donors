(function(){
    const $ = (sel) => document.querySelector(sel);
    const listEl = $("#donorList");
    const countEl = $("#countBadge");
    const form = $("#searchForm");
    const bloodEl = $("#blood_group");
    const districtEl = $("#district");
    const typeEl = $("#donor_type");
    const donationDateEl = $("#donation_date");
    
    // Footer form elements
    const footerForm = document.querySelector(".footer-search form");
    const footerBloodEl = $("#footer_blood_group");
    const footerDistrictEl = $("#footer_district");
    const footerTypeEl = $("#footer_donor_type");
    const footerDonationDateEl = $("#footer_donation_date");
  
    let donors = [];
    let currentFilters = {};
  
    // Load JSON data
    fetch("donors.json")
      .then(r => r.json())
      .then(data => {
        donors = data;
        hydrateDistrictOptions(data);
        render(data);
        updateStatistics(data);
        showSearchMessage("Ready to search donors. Use the form above to find blood donors.");
        showNotification("Data loaded successfully!", "success");
      })
      .catch(err => {
        console.error("Error loading donors:", err);
        listEl.innerHTML = '<li class="item error"><strong>Failed to load donors.json</strong><br><small>Please check if the file exists and is accessible.</small></li>';
        countEl.textContent = "0";
        showSearchMessage("Error loading donor data. Please refresh the page.");
        showNotification("Failed to load donor data. Please refresh the page.", "error");
      });
  
    // Update statistics with real data
    function updateStatistics(data) {
      const uniqueDistricts = new Set(data.map(d => d.district)).size;
      const uniqueBloodGroups = new Set(data.map(d => d.blood_group)).size;
      
      // Update stats section if it exists
      const statsSection = document.querySelector('.stats-section');
      if (statsSection) {
        const donorCount = statsSection.querySelector('.stat-item:nth-child(1) h3');
        const districtCount = statsSection.querySelector('.stat-item:nth-child(2) h3');
        const bloodGroupCount = statsSection.querySelector('.stat-item:nth-child(3) h3');
        
        if (donorCount) donorCount.textContent = `${data.length} Donors`;
        if (districtCount) districtCount.textContent = `${uniqueDistricts} Districts`;
        if (bloodGroupCount) bloodGroupCount.textContent = `${uniqueBloodGroups} Blood Groups`;
      }
    }
  
    // Fill district options dynamically
    function hydrateDistrictOptions(data){
      const unique = Array.from(new Set(data.map(d => d.district))).sort();
      
      // Clear existing options first
      districtEl.innerHTML = '<option value="">Select</option>';
      footerDistrictEl.innerHTML = '<option value="">Select</option>';
      
      // Add all common districts to main search forms
      const allDistricts = [
        'Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 
        'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Noakhali',
        'Feni', 'Lakshmipur', 'Chandpur', 'Cox\'s Bazar', 'Brahmanbaria'
      ];
      
      // Add common districts first
      allDistricts.forEach(district => {
        // Main form
        const opt = document.createElement("option");
        opt.value = district;
        opt.textContent = district;
        districtEl.appendChild(opt);
        
        // Footer form
        const footerOpt = document.createElement("option");
        footerOpt.value = district;
        footerOpt.textContent = district;
        footerDistrictEl.appendChild(footerOpt);
      });
      
      // Then add any additional districts from the data
      unique.forEach(district => {
        if (!allDistricts.includes(district)) {
          // Main form
          const opt = document.createElement("option");
          opt.value = district;
          opt.textContent = district;
          districtEl.appendChild(opt);
          
          // Footer form
          const footerOpt = document.createElement("option");
          footerOpt.value = district;
          footerOpt.textContent = district;
          footerDistrictEl.appendChild(footerOpt);
        }
      });
      
      // Also populate registration form districts
      populateRegistrationDistricts();
    }
    
    // Function to populate registration district dropdown
    function populateRegistrationDistricts() {
      if (donors.length > 0) {
        let regDistrictEl = $("#reg_district");
        if (!regDistrictEl) {
          regDistrictEl = document.getElementById("reg_district");
        }
        
        if (regDistrictEl) {
          const uniqueDistricts = Array.from(new Set(donors.map(d => d.district))).sort();
          
          // Clear existing options first and add default option
          regDistrictEl.innerHTML = '<option value="">Select</option>';
          
          // Add all district options
          const allDistricts = [
            'Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 
            'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Noakhali',
            'Feni', 'Lakshmipur', 'Chandpur', 'Cox\'s Bazar', 'Brahmanbaria'
          ];
          
          allDistricts.forEach(district => {
            const opt = document.createElement("option");
            opt.value = district;
            opt.textContent = district;
            regDistrictEl.appendChild(opt);
          });
          
          // Also add districts from the data if they exist
          uniqueDistricts.forEach(district => {
            if (!allDistricts.includes(district)) {
              const opt = document.createElement("option");
              opt.value = district;
              opt.textContent = district;
              regDistrictEl.appendChild(opt);
            }
          });
        }
      }
    }
  
    // Handle main search form
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      performSearch();
    });
    
    // Handle footer search form
    if (footerForm) {
      footerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        performSearch();
        
        // Scroll to results section
        document.querySelector('.results-section').scrollIntoView({ 
          behavior: 'smooth' 
        });
      });
    }
    
    // Perform search with current form values
    function performSearch() {
      // Show loading state
      showLoadingState(true);
      
      // Simulate a small delay for better UX
      setTimeout(() => {
        const filters = {
          blood: bloodEl.value,
          district: districtEl.value,
          type: typeEl.value,
          donationDate: donationDateEl.value ? new Date(donationDateEl.value) : null,
        };
        
        // Also check footer form values
        if (footerForm) {
          filters.blood = filters.blood || footerBloodEl.value;
          filters.district = filters.district || footerDistrictEl.value;
          filters.type = filters.type || footerTypeEl.value;
          filters.donationDate = filters.donationDate || (footerDonationDateEl.value ? new Date(footerDonationDateEl.value) : null);
        }
        
        currentFilters = filters;
        const filtered = filterDonors(filters);
        render(filtered);
        
        // Show search message
        if (filtered.length === 0) {
          showSearchMessage("No donors found matching your criteria. Try adjusting your search filters.");
        } else {
          showSearchMessage(`Found ${filtered.length} donor(s) matching your criteria.`);
        }
        
        // Hide loading state
        showLoadingState(false);
      }, 300);
    }
    
    // Show/hide loading state
    function showLoadingState(show) {
      const searchBtn = form.querySelector('button[type="submit"]');
      const footerSearchBtn = footerForm ? footerForm.querySelector('button[type="submit"]') : null;
      
      if (show) {
        if (searchBtn) {
          searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
          searchBtn.disabled = true;
        }
        if (footerSearchBtn) {
          footerSearchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
          footerSearchBtn.disabled = false;
        }
      } else {
        if (searchBtn) {
          searchBtn.innerHTML = 'Search';
          searchBtn.disabled = false;
        }
        if (footerSearchBtn) {
          footerSearchBtn.innerHTML = 'Search Donors';
          footerSearchBtn.disabled = false;
        }
      }
    }
    
    // Add real-time search functionality
    function addRealTimeSearch() {
      // Add event listeners for real-time filtering
      [bloodEl, districtEl, typeEl, donationDateEl].forEach(el => {
        if (el) {
          el.addEventListener('change', () => {
            // Debounce the search to avoid too many calls
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(performSearch, 300);
          });
          
          // Add Enter key support
          el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              performSearch();
            }
          });
        }
      });
      
      // Also add to footer form
      if (footerForm) {
        [footerBloodEl, footerDistrictEl, footerTypeEl, footerDonationDateEl].forEach(el => {
          if (el) {
            el.addEventListener('change', () => {
              clearTimeout(window.searchTimeout);
              window.searchTimeout = setTimeout(performSearch, 300);
            });
            
            // Add Enter key support
            el.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                performSearch();
              }
            });
          }
        });
      }
      
      // Add clear search functionality
      const clearBtn = document.getElementById('clearSearch');
      const footerClearBtn = document.getElementById('footerClearSearch');
      
      if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
      }
      
      if (footerClearBtn) {
        footerClearBtn.addEventListener('click', clearSearch);
      }
      
      // Add keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          bloodEl.focus();
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
          clearSearch();
        }
      });
      
      // Add quick search buttons for common blood groups
      addQuickSearchButtons();
    }
    
    // Add quick search buttons for common blood groups
    function addQuickSearchButtons() {
      const searchSection = document.querySelector('.search-section');
      if (!searchSection) return;
      
      // Check if quick search buttons already exist
      if (document.getElementById('quickSearchButtons')) return;
      
      const quickSearchDiv = document.createElement('div');
      quickSearchDiv.id = 'quickSearchButtons';
      quickSearchDiv.className = 'quick-search-buttons';
      quickSearchDiv.innerHTML = `
        <h4><i class="fas fa-bolt"></i> Quick Search</h4>
        <div class="quick-buttons">
          <button class="btn btn-outline" data-blood="A+">A+</button>
          <button class="btn btn-outline" data-blood="B+">B+</button>
          <button class="btn btn-outline" data-blood="O+">O+</button>
          <button class="btn btn-outline" data-blood="AB+">AB+</button>
        </div>
      `;
      
      // Insert after the search form
      const form = searchSection.querySelector('form');
      if (form) {
        form.parentNode.insertBefore(quickSearchDiv, form.nextSibling);
      }
      
      // Add event listeners to quick search buttons
      const quickButtons = quickSearchDiv.querySelectorAll('.btn-outline');
      quickButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          const bloodGroup = this.getAttribute('data-blood');
          bloodEl.value = bloodGroup;
          performSearch();
          
          // Scroll to results
          document.querySelector('.results-section').scrollIntoView({ 
            behavior: 'smooth' 
          });
        });
      });
    }
    
    // Clear search function
    function clearSearch() {
      // Clear main form
      if (bloodEl) bloodEl.value = '';
      if (districtEl) districtEl.value = '';
      if (typeEl) typeEl.value = '';
      if (donationDateEl) donationDateEl.value = '';
      
      // Clear footer form
      if (footerBloodEl) footerBloodEl.value = '';
      if (footerDistrictEl) footerDistrictEl.value = '';
      if (footerTypeEl) footerTypeEl.value = '';
      if (footerDonationDateEl) footerDonationDateEl.value = '';
      
      // Reset search and show all donors
      currentFilters = {};
      render(donors);
      showSearchMessage("Search cleared. Showing all available donors.");
    }
    
    // Expose for inline onclick in Active Filters summary
    window.clearSearch = clearSearch;
    
    // Filter donors based on criteria
    function filterDonors(filters) {
      return donors.filter(d => {
        const okBlood = !filters.blood || d.blood_group === filters.blood;
        const okDistrict = !filters.district || d.district === filters.district;
        const okType = !filters.type || d.type === filters.type;
        
        // Handle donation date filtering more intelligently
        let okDonationDate = true;
        if (filters.donationDate) {
          const donorLastDonation = new Date(d.last_donation);
          const searchDate = new Date(filters.donationDate);
          
          // Check if donor's last donation is after the search date
          okDonationDate = donorLastDonation >= searchDate;
        }
        
        return okBlood && okDistrict && okType && okDonationDate;
      });
    }
    
    // Show search message
    function showSearchMessage(message) {
      const messageEl = document.getElementById('searchMessage');
      if (!messageEl) {
        // Create message element if it doesn't exist
        const messageDiv = document.createElement('div');
        messageDiv.id = 'searchMessage';
        messageDiv.className = 'search-message';
        messageDiv.innerHTML = `<p>${message}</p>`;
        
        // Insert after the search form
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
          searchSection.appendChild(messageDiv);
        }
      } else {
        messageEl.innerHTML = `<p>${message}</p>`;
      }
      
      // Show search summary if there are active filters
      showSearchSummary();
    }
    
    // Show search summary with active filters
    function showSearchSummary() {
      const summaryEl = document.getElementById('searchSummary');
      const activeFilters = Object.entries(currentFilters).filter(([key, value]) => value && value !== '');
      
      if (activeFilters.length === 0) {
        if (summaryEl) {
          summaryEl.remove();
        }
        return;
      }
      
      if (!summaryEl) {
        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'searchSummary';
        summaryDiv.className = 'search-summary';
        
        // Insert after the search message
        const messageEl = document.getElementById('searchMessage');
        if (messageEl && messageEl.parentNode) {
          messageEl.parentNode.insertBefore(summaryDiv, messageEl.nextSibling);
        }
      }
      
      const filterLabels = {
        blood: 'Blood Group',
        district: 'District',
        type: 'Donor Type',
        donationDate: 'Donation Date'
      };
      
      const summaryHTML = `
        <div class="summary-header">
          <h4><i class="fas fa-filter"></i> Active Filters</h4>
          <button type="button" class="btn-clear-filters" onclick="clearSearch()">
            <i class="fas fa-times"></i> Clear All
          </button>
        </div>
        <div class="active-filters">
          ${activeFilters.map(([key, value]) => {
            let displayValue = value;
            if (key === 'donationDate') {
              displayValue = new Date(value).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
            return `<span class="filter-tag">${filterLabels[key]}: ${displayValue}</span>`;
          }).join('')}
        </div>
      `;
      
      summaryEl.innerHTML = summaryHTML;
    }
  
    function render(items){
      listEl.innerHTML = "";
      countEl.textContent = items.length;
      
      if (!items.length){
        // Show helpful suggestions when no results found
        const suggestions = getSearchSuggestions();
        listEl.innerHTML = `
          <li class='item no-results'>
            <i class='fas fa-search'></i>
            <p>No donors found matching your criteria</p>
            <small>Try adjusting your search filters or contact us for assistance.</small>
            ${suggestions ? `<div class="search-suggestions">${suggestions}</div>` : ''}
          </li>
        `;
        return;
      }
      
      for (const d of items){
        const li = document.createElement("li");
        li.className = "item";
        
        // Calculate days since last donation
        const lastDonation = new Date(d.last_donation);
        const today = new Date();
        const daysSinceDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));
        
        // Determine availability status
        let availabilityStatus = '';
        let statusClass = '';
        if (daysSinceDonation >= 56) { // 8 weeks = 56 days
          availabilityStatus = 'Available';
          statusClass = 'available';
        } else if (daysSinceDonation >= 42) { // 6 weeks
          availabilityStatus = 'Soon Available';
          statusClass = 'soon-available';
        } else {
          availabilityStatus = 'Not Available';
          statusClass = 'not-available';
        }
        
        li.innerHTML = `
          <div class="donor-header">
            <h3>${d.name} <span class="tag">${d.blood_group}</span></h3>
            <span class="availability ${statusClass}">${availabilityStatus}</span>
          </div>
          <p class="meta"><i class="fas fa-map-marker-alt"></i> ${d.district}</p>
          <p class="meta"><i class="fas fa-calendar"></i> Last donation: ${formatDate(d.last_donation)} (${daysSinceDonation} days ago)</p>
          <p class="meta"><i class="fas fa-user-tag"></i> ${d.type}</p>
          <p class="meta contact"><i class="fas fa-phone"></i> <a href="tel:${d.mobile}">${d.mobile}</a></p>
        `;
        listEl.appendChild(li);
      }
    }
    
    // Get search suggestions when no results found
    function getSearchSuggestions() {
      const suggestions = [];
      
      if (currentFilters.blood) {
        suggestions.push(`Try searching for other blood groups`);
      }
      if (currentFilters.district) {
        suggestions.push(`Try searching in nearby districts`);
      }
      if (currentFilters.donationDate) {
        suggestions.push(`Try adjusting the donation date requirement`);
      }
      if (currentFilters.type) {
        suggestions.push(`Try searching for all donor types`);
      }
      
      if (suggestions.length > 0) {
        return `
          <div class="suggestions">
            <h5>Suggestions:</h5>
            <ul>
              ${suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      return '';
    }
    
    // Format date for display
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // Add some interactive features
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize real-time search
      addRealTimeSearch();
      
      // Smooth scrolling for navigation links
      const navLinks = document.querySelectorAll('.nav a[href^="#"]');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
      
      // Add hover effects to buttons
      const buttons = document.querySelectorAll('.btn');
      buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
        });
      });
      
      // Registration Modal Functionality
      const modal = $("#registrationModal");
      const joinDonorBtn = document.querySelector('.hero-buttons .btn-primary');
      const closeBtn = document.querySelector('.close');
      const cancelBtn = $("#cancelRegistration");
      const registrationForm = $("#registrationForm");
      const regDistrictEl = $("#reg_district");
      
      // Open modal when "Join as a Donor" button is clicked
      if (joinDonorBtn) {
        joinDonorBtn.addEventListener('click', function() {
          // Populate districts before opening modal
          populateRegistrationDistricts();
          modal.style.display = 'block';
          document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
      }
      
      // Close modal functions
      function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        registrationForm.reset();
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
      }
      
      // Close modal when clicking outside
      window.addEventListener('click', function(event) {
        if (event.target === modal) {
          closeModal();
        }
      });
      
      // Handle registration form submission
      if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Get form data
          const formData = {
            name: $("#reg_name").value,
            mobile: $("#reg_mobile").value,
            email: $("#reg_email").value || '',
            blood_group: $("#reg_blood_group").value,
            district: $("#reg_district").value,
            last_donation: $("#reg_last_donation").value || '',
            type: $("#reg_type").value,
            age: $("#reg_age").value || ''
          };
          
          // Validate required fields
          if (!formData.name || !formData.mobile || !formData.blood_group || !formData.district || !formData.type) {
            alert('Please fill in all required fields marked with *');
            return;
          }
          
          // Validate mobile number (Bangladesh format)
          const mobileRegex = /^01[3-9]\d{8}$/;
          if (!mobileRegex.test(formData.mobile)) {
            alert('Please enter a valid Bangladesh mobile number (e.g., 01712345678)');
            return;
          }
          
          // Add new donor to the list
          const newDonor = {
            id: donors.length + 1,
            ...formData,
            last_donation: formData.last_donation || new Date().toISOString().split('T')[0]
          };
          
          donors.push(newDonor);
          
          // Update the display
          render(donors);
          
          // Show success message
          showNotification('Registration successful! You are now registered as a blood donor.', 'success');
          
          // Close modal
          closeModal();
        });
      }
    });
    
    // Show notification
    function showNotification(message, type = "info") {
      // Remove existing notifications
      const existingNotifications = document.querySelectorAll('.notification');
      existingNotifications.forEach(n => n.remove());
      
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
          <span>${message}</span>
          <button class="notification-close">&times;</button>
        </div>
      `;
      
      // Add to page
      document.body.appendChild(notification);
      
      // Show notification
      setTimeout(() => {
        notification.classList.add('show');
      }, 100);
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        hideNotification(notification);
      }, 5000);
      
      // Close button functionality
      const closeBtn = notification.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          hideNotification(notification);
        });
      }
    }
    
    // Hide notification
    function hideNotification(notification) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
    
  })();
  