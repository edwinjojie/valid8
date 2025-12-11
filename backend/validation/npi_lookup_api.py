import requests

def fetch_npi(npi_number):
    url = f"https://npiregistry.cms.hhs.gov/api/?number={npi_number}&version=2.1"
    resp = requests.get(url).json()

    if "results" not in resp or not resp["results"]:
        return None

    result = resp["results"][0]

    basic = result.get("basic", {})
    addresses = result.get("addresses", [])
    taxonomies = result.get("taxonomies", [])

    # Build full name
    name = " ".join([
        basic.get("name_prefix", ""),
        basic.get("first_name", ""),
        basic.get("middle_name", ""),
        basic.get("last_name", ""),
        basic.get("credential", "")
    ]).strip()

    # Primary address (LOCATION > MAILING)
    primary_address = None
    primary_phone = None

    if addresses:
        # Prefer LOCATION address if available
        loc = next((a for a in addresses if a.get("address_purpose") == "LOCATION"), addresses[0])
        primary_address = ", ".join(filter(None, [
            loc.get("address_1"),
            loc.get("address_2"),
            loc.get("city"),
            loc.get("state"),
            loc.get("postal_code")
        ]))
        primary_phone = loc.get("telephone_number")

    # Primary taxonomy / specialty
    specialty = None
    license_number = None

    if taxonomies:
        primary_tax = next((t for t in taxonomies if t.get("primary") == True), taxonomies[0])
        specialty = primary_tax.get("desc")
        license_number = primary_tax.get("license")

    return {
        "full_name": name,
        "specialty": specialty,
        "address": primary_address,
        "phone": primary_phone,
        "license_number": license_number,
        "npi_number": npi_number,
        "source": "NPI Registry API"
    }
