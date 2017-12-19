
// Global variables
var spotify_client_id = "75175a4b40a547289ffd4bab03029947";
var ticketMaster_key = "MA05CNrNRiMA6ysLGah2vZ8ZG4DY3Ayl";
var access_token, expires_in, token_type;
var user_latitude, user_longitude;
var intervalId;
var testInterval = 5;

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
            $("#token-timer").text("Token expires in " + expires_in);
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
            $("#following-artits").hide();
            $("#artist-search").hide();

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    user_latitude = position.coords.latitude;
                    user_longitude = position.coords.longitude;
                });
            }
        }
    });
}
else {
    $('#loggedIn').hide();
    $('#landing').show();
    $("#following-artists").hide();
    $("#artist-search").hide();
    $("#concert-events").hide();
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

function renderEventResults(artistValue){
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
            $("#concert-events").empty();

            if (json.page.totalElements > 0) {
                var eventsList = $("#concert-events");

                for (var i = 0; i < json._embedded.events.length; i++) {
                    var concertEvent = $("<div>");
                    concertEvent.addClass("event");

                    //  Description row
                    var eventDescriptionRow = $("<div>");
                    eventDescriptionRow.addClass("row");

                    var eventDescriptionCol = $("<div>");
                    eventDescriptionCol.addClass("col-md-12");

                    var ceDescription = $("<h3>");
                    ceDescription.text(json._embedded.events[i].name);
                    eventDescriptionCol.append(ceDescription);
                    eventDescriptionRow.append(eventDescriptionCol);
                    concertEvent.append(eventDescriptionRow);

                    //  Info row
                    var eventInfoRow = $("<div>");
                    eventInfoRow.addClass("row");

                    var eventInfoCol = $("<div>");
                    eventInfoCol.addClass("col-md-12");

                    var ceInfo = $("<p>");
                    ceInfo.addClass("event-info");
                    ceInfo.text(json._embedded.events[i].info);
                    eventInfoCol.append(ceInfo);
                    eventInfoRow.append(eventInfoCol);
                    concertEvent.append(eventInfoRow);

                    //  Details row
                    var eventDetailsRow = $("<div>");
                    eventDetailsRow.addClass("row");

                    var eventDetailsCol1 = $("<div>");
                    eventDetailsCol1.addClass("col-md-3");

                    var eventStartDate = $("<p>");
                    eventStartDate.addClass("event-detail");
                    eventStartDate.html("<strong>Date:</strong> " + json._embedded.events[i].dates.start.localDate);
                    eventDetailsCol1.append(eventStartDate);
                    eventDetailsRow.append(eventDetailsCol1);

                    var eventDetailsCol2 = $("<div>");
                    eventDetailsCol2.addClass("col-md-3");

                    var eventVenue = $("<p>");
                    eventVenue.addClass("event-detail");
                    eventVenue.html("<strong>Venue:</strong> " + json._embedded.events[i]._embedded.venues[0].name);
                    eventDetailsCol2.append(eventVenue);
                    eventDetailsRow.append(eventDetailsCol2);

                    var eventDetailsCol3 = $("<div>");
                    eventDetailsCol3.addClass("col-md-3");

                    var eventLocation = $("<p>");
                    eventLocation.addClass("event-detail");
                    eventLocation.html("<strong>Location:</strong> " + json._embedded.events[i]._embedded.venues[0].city.name + ", " + json._embedded.events[i]._embedded.venues[0].state.name);
                    eventDetailsCol3.append(eventLocation);
                    eventDetailsRow.append(eventDetailsCol3);

                    var eventDetailsCol4 = $("<div>");
                    eventDetailsCol4.addClass("col-md-3");

                    var eventPrice = $("<p>");
                    eventPrice.addClass("event-detail");
                    eventPrice.html("<strong>Prices:</strong> $" + json._embedded.events[i].priceRanges[0].min + " - $" + json._embedded.events[i].priceRanges[0].max);
                    eventDetailsCol4.append(eventPrice);
                    eventDetailsRow.append(eventDetailsCol4);
                    concertEvent.append(eventDetailsRow);

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
                    seatMapLink.attr("href", json._embedded.events[i].seatmap.staticUrl);
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

            }
        },
        error: function (xhr, status, err) {
            console.log(err);
        }
    });
}

function tokenExpirationTimer(){
    expires_in--;

    if(expires_in === 0){
        access_token = undefined;
        token_type = undefined;
        expires_in = 0;
        alert("Token has expired!");
        window.location.href = window.location.origin;
    }
    else{
        $("#token-timer").text("Token expires in " + expires_in);
    }
}

//  Events
$("#spotify-login").on("click", function () {
    event.preventDefault();

    var authUrl = "https://accounts.spotify.com/authorize?" + $.param({
        "client_id": spotify_client_id,
        "response_type": "token",
        "redirect_uri": window.location.href,
        "scope": "user-follow-read"
    });

    window.location = authUrl;
});

$("#show-following-artists-form").on("click", function () {
    $("#show-artist-form").removeClass("btn-success");
    $(this).removeClass("btn-default");
    $(this).addClass("btn-success");
    $("#following-artists").show();
    $("#artist-search").hide();

    $.ajax({
        url: "https://api.spotify.com/v1/me/following?type=artist&limit=20",
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        success: function (response) {
            $("#spotify-artist-container").empty();
            var artistContainer = $("#spotify-artist-container");

            for (var i = 0; i < response.artists.items.length; i += 2) {
                var artistRow = $("<div>");
                artistRow.addClass("row");

                for (var j = i; j < i + 2; j++) {
                    var artistCol = $("<div>");
                    artistCol.addClass("col-md-6");

                    var artistContent = $("<div>");
                    artistContent.addClass("artist");

                    var artistImg = $("<img>");
                    artistImg.addClass("artist-image");
                    artistImg.attr("src", response.artists.items[j].images[0].url);
                    artistContent.append(artistImg);

                    var artistName = $("<h3>");
                    artistName.text(response.artists.items[j].name);
                    artistContent.append(artistName);

                    var artistGenre = $("<p>");
                    artistGenre.html("<strong>Genre:</strong> " + response.artists.items[j].genres[0]);
                    artistContent.append(artistGenre);

                    var artistPopularity = $("<p>");
                    artistPopularity.html("<strong>Popularity:</strong> " + response.artists.items[j].popularity);
                    artistContent.append(artistPopularity);

                    var artistButton = $("<button>");
                    artistButton.attr("data-id", response.artists.items[j].id);
                    artistButton.attr("data-name", response.artists.items[j].name);
                    artistButton.addClass("btn btn-success artist-button");
                    artistButton.text("Select");
                    artistContent.append(artistButton);

                    artistCol.append(artistContent);
                    artistRow.append(artistCol);
                }

                artistContainer.append(artistRow);
            }
        }
    });
});

$("#show-artist-form").on("click", function () {
    $("#show-following-artists-form").removeClass("btn-success");
    $(this).removeClass("btn-default");
    $(this).addClass("btn-success");
    $("#artist-search").show();
    $("#following-artists").hide();
});

$("#spotify-artist-container").on("click", ".artist-button", function () {
    $("#concert-events").empty();
    var artistToSearchFor = $(this).attr("data-name");
    renderEventResults(artistToSearchFor);
});

$("#search-artist").on("click", function(){
    var artistToSearchFor = $("#artist-input").val().trim();
    renderEventResults(artistToSearchFor);
});