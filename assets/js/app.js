
// Global variables
var spotify_client_id = "92134d40a5be46bbb3926f6e43c0969d";
var ticketMaster_key = "MA05CNrNRiMA6ysLGah2vZ8ZG4DY3Ayl";
var access_token, expires_in, token_type;
var token_expires_date;
var user_latitude, user_longitude;
var intervalId;

var params = getHashParams();

access_token = params.access_token;
expires_in = params.expires_in;
token_type = params.token_type;

if (access_token) {
    $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': token_type + ' ' + access_token
        },
        success: function (response) {
            token_expires_date = moment().add(expires_in, "seconds");
            intervalId = setInterval(tokenExpirationTimer, 1000);

            spotify_userid = response.id;
            if (response.display_name == null) {
                $("#spotify-username").text(response.id);
            }
            else {
                $("#spotify-username").text(response.display_name);
            }
            $('#landing').hide();
            $('#loggedin').show();
            $("#spotify-username").show();
            $("#spotify-login").hide();

            renderFollowingArtists();

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    user_latitude = position.coords.latitude;
                    user_longitude = position.coords.longitude;
                });
            }
        },
        error: function(error){
            $("#loggedIn").hide();
            $("#spotify-username").hide();
        }
    });
}
else {
    $('#loggedIn').hide();
    $('#landing').show();
    $("#spotify-login").show();
    $("#spotify-username").hide();
}

//  Functions
function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

function renderFollowingArtists() {
    $.ajax({
        url: "https://api.spotify.com/v1/me/following?type=artist&limit=20",
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        success: function (response) {
            console.log(response);
            $("#spotify-artist-container").empty();
            $("#artist-count").text(response.artists.total);
            var artistContainer = $("#spotify-artist-container");

            for (var i = 0; i < response.artists.items.length; i++) {
                var artistContent = $("<div>");
                artistContent.addClass("artist");

                var artistImg = $("<img>");
                artistImg.addClass("artist-image");
                artistImg.attr("src", response.artists.items[i].images[0].url);
                artistContent.append(artistImg);

                var artistName = $("<p>");
                artistName.addClass("artist-name");
                artistName.text(response.artists.items[i].name);
                artistContent.append(artistName);

                var artistGenre = $("<p>");
                artistGenre.addClass("artist-detail");
                artistGenre.html("<strong>Genre:</strong> " + response.artists.items[i].genres[0]);
                artistContent.append(artistGenre);

                var artistPopularity = $("<p>");
                artistPopularity.addClass("artist-detail");
                artistPopularity.html("<strong>Popularity:</strong> " + response.artists.items[i].popularity);
                artistContent.append(artistPopularity);

                var artistButton = $("<button>");
                artistButton.attr("data-id", response.artists.items[i].id);
                artistButton.attr("data-name", response.artists.items[i].name);
                artistButton.addClass("btn btn-success artist-button");
                artistButton.text("Select");
                artistContent.append(artistButton);
                artistContainer.append(artistContent);
            }
        },
        error: function (error) {
            console.log(error);
        }
    });
}

function renderEventResults(artistValue) {
    $("#loading-spinner").show();

    $.ajax({
        type: "GET",
        url: "https://app.ticketmaster.com/discovery/v2/events.json?" + $.param({
            "apikey": ticketMaster_key,
            "keyword": artistValue,
            "geoPoint": user_latitude + "," + user_longitude,
            "radius": 100,
            "unit": "miles"
        }),
        async: true,
        dataType: "json",
        success: function (json) {
            console.log(json);
            $("#concert-events").empty();

            if (json.page.totalElements > 0) {
                var eventsList = $("#concert-events");

                for (var i = 0; i < json._embedded.events.length; i++) {
                    var concertEvent = $("<div>");
                    concertEvent.addClass("event animation-target");

                    //  Event Info
                    var eventInfoRow = $("<div>");
                    eventInfoRow.addClass("row");

                    var eventInfoCol = $("<div>");
                    eventInfoCol.addClass("col-md-12");

                    var eventImage = $("<img>");
                    eventImage.attr("src", json._embedded.events[i].images[0].url);
                    eventImage.addClass("event-image");
                    eventInfoCol.append(eventImage);

                    var ceDescription = $("<p>");
                    ceDescription.addClass("event-name");
                    ceDescription.html(json._embedded.events[i].name);
                    eventInfoCol.append(ceDescription);

                    var eventStartDate = $("<p>");
                    eventStartDate.addClass("event-detail");
                    eventStartDate.html("<strong>Date:</strong> " + json._embedded.events[i].dates.start.localDate);
                    eventInfoCol.append(eventStartDate);

                    var eventLocation = $("<p>");
                    eventLocation.addClass("event-detail");
                    eventLocation.html("<strong>Location:</strong> " + json._embedded.events[i]._embedded.venues[0].name + ", " + json._embedded.events[i]._embedded.venues[0].city.name + ", " + json._embedded.events[i]._embedded.venues[0].state.name);
                    eventInfoCol.append(eventLocation);

                    var eventPrice = $("<p>");
                    eventPrice.addClass("event-detail");
                    if(json._embedded.events[i].priceRanges){
                        eventPrice.html("<strong>Prices:</strong> $" + json._embedded.events[i].priceRanges[0].min + " - $" + json._embedded.events[i].priceRanges[0].max);
                    }
                    else{
                        eventPrice.html("<strong>Prices:</strong> N/A");
                    }
                    eventInfoCol.append(eventPrice);

                    eventInfoRow.append(eventInfoCol);
                    concertEvent.append(eventInfoRow);

                    //  More Info
                    var eventMoreInfoRow = $("<div>");
                    eventMoreInfoRow.addClass("row");

                    var eventMoreInfoCol = $("<div>");
                    eventMoreInfoCol.addClass("col-md-12");

                    var moreInfoButton = $("<a>");
                    moreInfoButton.attr("role", "button");
                    moreInfoButton.addClass("btn btn-primary more-info-button");
                    moreInfoButton.attr("data-toggle", "collapse");
                    moreInfoButton.attr("aria-expanded", "false");
                    moreInfoButton.attr("aria-controls", "event-" + json._embedded.events[i].id);
                    moreInfoButton.attr("href", "#event-" + json._embedded.events[i].id);
                    moreInfoButton.text("More Info");
                    eventMoreInfoCol.append(moreInfoButton);

                    var moreInfoSection = $("<div>");
                    moreInfoSection.attr("id", "event-" + json._embedded.events[i].id);
                    moreInfoSection.addClass("collapse");

                    var ceInfo = $("<div>");
                    ceInfo.addClass("well");
                    if(json._embedded.events[i].info){
                        ceInfo.text(json._embedded.events[i].info);
                    }
                    else{
                        ceInfo.text("Not available");
                    }
                    moreInfoSection.append(ceInfo);

                    eventMoreInfoCol.append(moreInfoSection);
                    eventMoreInfoRow.append(eventMoreInfoCol);
                    concertEvent.append(eventMoreInfoRow);

                    //  Links Row
                    var eventLinksRow = $("<div>");
                    eventLinksRow.addClass("row");

                    var eventLinksCol = $("<div>");
                    eventLinksCol.addClass("col-md-12");

                    var eventLinks = $("<div>");
                    eventLinks.addClass("event-links clear-fix");

                    var ticketMasterLink = $("<a>");
                    ticketMasterLink.attr("href", json._embedded.events[i].url);
                    ticketMasterLink.attr("target", "_blank");
                    ticketMasterLink.addClass("btn btn-success");
                    ticketMasterLink.text("Buy tickets");
                    eventLinks.append(ticketMasterLink);

                    var seatMapLink = $("<a>");
                    if(json._embedded.events[i].seatmap){
                        seatMapLink.attr("href", json._embedded.events[i].seatmap.staticUrl);
                    }
                    else{
                        seatMapLink.attr("href", "#");
                    }
                    seatMapLink.attr("target", "_blank");
                    seatMapLink.addClass("btn btn-default");
                    seatMapLink.text("Seat Map");
                    eventLinks.append(seatMapLink);

                    eventLinksCol.append(eventLinks);
                    eventLinksRow.append(eventLinksCol);
                    concertEvent.append(eventLinksRow);

                    eventsList.append(concertEvent);
                }
            }
            else {
                var noResultsDiv = $("<div>");
                noResultsDiv.addClass("no-results");
                noResultsDiv.text("No events found!");

                $("#concert-events").append(noResultsDiv);
            }
        },
        error: function (xhr, status, err) {
            console.log(err);
        }
    });

    $("#loading-spinner").hide();
}

function tokenExpirationTimer() {
    expires_in--;

    if (expires_in === 0) {
        access_token = undefined;
        token_type = undefined;
        expires_in = 0;
        clearInterval(this.intervalId);

        var tokenExpiredMessage = $("<p>");
        tokenExpiredMessage.text("Your token has expired!");
        $("#token-expired-content").append(tokenExpiredMessage);
        $("#token-expired-modal").modal("show");
    }
}

//  Events

$("#refresh-fa").on("click", function () {
    renderFollowingArtists();
});

$(".spotify-login-button").on("click", function () {
    event.preventDefault();

    $("#token-expired-modal").modal("hide");

    var authUrl = "https://accounts.spotify.com/authorize?" + $.param({
        "client_id": spotify_client_id,
        "response_type": "token",
        "redirect_uri": "https://sbell093.github.io/Project-1/",
        "scope": "user-follow-read"
    });

    window.location = authUrl;
});

$(".cancel-button").on("click", function(){
    $("#token-expired-modal").modal("hide");

    window.location.href = "https://sbell093.github.io/Project-1/";
});

$("#spotify-artist-container").on("click", ".artist-button", function () {
    $("#concert-events").empty();
    var artistToSearchFor = $(this).attr("data-name");
    $("#artist-input").val(artistToSearchFor);
    renderEventResults(artistToSearchFor);
});

$("#search-events").on("click", function () {
    var artistToSearchFor = $("#artist-input").val().trim();
    renderEventResults(artistToSearchFor);
});