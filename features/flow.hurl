POST {{oidc_issuer}}/oauth/token
Content-Type: application/json
{
    "client_id":"{{ oidc_client_id }}",
    "client_secret":"{{ oidc_client_secret }}",
    "audience": "{{ oidc_audience }}",
    "grant_type":"client_credentials"
}

HTTP 200
[Captures]
access_token: jsonpath "$['access_token']"


GET {{host}}/v1/scans

HTTP 200



# Create code! But fail because we don't have $.location
POST {{host}}/v1/scans
{
    "code": "123123123"
}

HTTP 400


# Create code! And fail on account of authentication
POST {{ host }}/v1/scans
{
    "code": "123123123",
    "location": "test:hurl"
}

HTTP 401


# Create code! And succeed
POST {{ host }}/v1/scans
Authorization: Bearer {{ access_token }}
{
    "code": "123123123",
    "location": "test:hurl"
}

HTTP 201
[Asserts]
header "Content-Type" contains "utf-8"
jsonpath "$.code" == "123123123"
jsonpath "$.location" == "test:hurl"
jsonpath "$.id" != null


POST {{ host }}/v1/codes/123123123/pictures/
Authorization: Bearer {{ access_token }}
[MultipartFormData]
file: file,winnie-the-pooh.jpg; image/jpeg

HTTP 201
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.id" != null
[Captures]
picture_id: jsonpath "$['id']"

GET {{ host }}/v1/codes/123123123/pictures/

HTTP 200
[Asserts]
jsonpath "$.items[*].id" includes "{{ picture_id }}"
