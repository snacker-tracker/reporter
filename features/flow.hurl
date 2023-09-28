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
    "code": "{{ code }}"
}

HTTP 400


# Create code! And fail on account of authentication
POST {{ host }}/v1/scans
{
    "code": "{{ code }}",
    "location": "test:hurl"
}

HTTP 401


# Create code! And succeed
POST {{ host }}/v1/scans
Authorization: Bearer {{ access_token }}
{
    "code": "{{ code }}",
    "location": "test:hurl"
}

HTTP 201
[Asserts]
header "Content-Type" contains "utf-8"
jsonpath "$.code" == "{{ code }}"
jsonpath "$.location" == "test:hurl"
jsonpath "$.id" != null


# Create the CODE
POST {{ host }}/v1/codes
Authorization: Bearer {{ access_token }}
{
    "code": "{{ code }}",
    "name": "Test Code {{ code }}",
    "categories": ["test", "automated-test"]
}

HTTP 201
[Asserts]
jsonpath "$.code" == "{{ code }}"
jsonpath "$.name" == "Test Code {{ code }}"


POST {{ host }}/v1/codes/{{ code }}/pictures/
Authorization: Bearer {{ access_token }}
[MultipartFormData]
file: file,winnie-the-pooh.jpg; image/jpeg

HTTP 201
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.id" != null
[Captures]
picture_id: jsonpath "$['id']"

GET {{ host }}/v1/codes/{{ code }}/pictures/

HTTP 200
[Asserts]
jsonpath "$.items[*].id" includes "{{ picture_id }}"
