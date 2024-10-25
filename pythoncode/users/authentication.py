import datetime
import logging
from dotenv import load_dotenv
import jwt
import pytz
import requests
from django.contrib.auth import get_user_model
from users.models import CustomUser as User
from django.core.cache import cache
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import os
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from jwt import algorithms
from jwt import PyJWKClient
import base64
import json
import time
from typing import Any, Dict, Optional, Tuple
from django.conf import settings
from jwt.algorithms import RSAAlgorithm

# Environment variables with defaults
CLERK_ISSUER = os.getenv('CLERK_ISSUER', 'https://native-mutt-80.clerk.accounts.dev')
ALLOWED_ORIGINS = os.getenv('ALLOWED_FRONTEND_URLS', 
    'http://localhost:3000,'
    'https://unicas-frontend-tau.vercel.app'
).split(',')

logger = logging.getLogger(__name__)

load_dotenv()
User = get_user_model()

CLERK_API_URL = "https://api.clerk.com/v1"
CLERK_FRONTEND_API_URL = os.getenv("CLERK_FRONTEND_API_URL")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
CACHE_KEY = "jwks_data"


# Helper function to pretty print dictionaries in logs
def format_dict(d: Dict) -> str:
    return json.dumps(d, indent=2, ensure_ascii=False)

            # Helper function to clean values
def clean_value(value: str) -> str:
    return value.rstrip(';').strip() if value else ''


class JWTAuthenticationMiddleware(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None
        try:
            token = auth_header.split(" ")[1]
            logger.info(f"Received token: {token}")
        except IndexError:
            raise AuthenticationFailed("Bearer token not provided.")
        user = self.decode_jwt(token)
        if not user:
            return None

        clerk = ClerkSDK()
        info, found = clerk.fetch_user_info(user.username)
        if found:
            user.email = info["email_address"]
            user.first_name = info["first_name"]
            user.last_name = info["last_name"]
            user.last_login = info["last_login"]
            user.save()

        return user, None
    
    def decode_jwt(self, token):
        clerk = ClerkSDK()
        jwks_data = clerk.get_jwks()
        public_key = RSAAlgorithm.from_jwk(jwks_data["keys"][0])
        try:
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_signature": True},
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired.")
        except jwt.DecodeError as e:
            raise AuthenticationFailed("Token decode error.")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid token.")

        user_id = payload.get("sub")
        if user_id:
            user, created = User.objects.get_or_create(username=user_id)
            return user
        return None
    # def decode_jwt(self, token):
    #     try:
    #         # Log the raw token structure
    #         token_parts = token.split('.')
    #         logger.info(f"Token has {len(token_parts)} parts")

    #         # Decode the header and payload parts without verification
    #         import base64
    #         import json

    #         def decode_base64_part(part):
    #             # Add padding if needed
    #             padding = 4 - (len(part) % 4)
    #             if padding != 4:
    #                 part += '=' * padding
                
    #             # Replace URL-safe characters
    #             part = part.replace('-', '+').replace('_', '/')
                
    #             try:
    #                 decoded = base64.b64decode(part)
    #                 return json.loads(decoded)
    #             except Exception as e:
    #                 logger.error(f"Error decoding part: {str(e)}")
    #                 return None

    #         # Decode and log header
    #         header_raw = decode_base64_part(token_parts[0])
    #         logger.info(f"Token header: {header_raw}")

    #         # Decode and log payload before JWT processing
    #         payload_raw = decode_base64_part(token_parts[1])
    #         logger.info(f"Raw decoded payload before JWT: {payload_raw}")

    #         # First decode without verification to log the claims
    #         unverified_payload = jwt.decode(
    #             token,
    #             options={"verify_signature": False},
    #             algorithms=["RS256"]
    #         )
    #         logger.info(f"Unverified JWT payload: {unverified_payload}")
            
    #         # Clean and log the initial values
    #         clean_issuer = clean_value(unverified_payload.get('iss'))
    #         clean_azp = clean_value(unverified_payload.get('azp'))
            
    #         logger.info(f"Token issuer (cleaned): {clean_issuer}")
    #         logger.info(f"Token azp (cleaned): {clean_azp}")

    #         # Verify the token
    #         jwks_client = PyJWKClient(CLERK_JWKS_URL)
    #         signing_key = jwks_client.get_signing_key_from_jwt(token)
    #         payload = jwt.decode(
    #             token,
    #             signing_key.key,
    #             algorithms=["RS256"],
    #             options={
    #                 "verify_signature": True,
    #                 "verify_aud": False,
    #                 "verify_iss": True,
    #             },
    #             issuer=CLERK_ISSUER
    #         )

    #         # Clean all values in the payload
    #         cleaned_payload = {
    #             key: clean_value(value) if isinstance(value, str) else value 
    #             for key, value in payload.items()
    #         }
            
    #         # Verify azp
    #         azp = cleaned_payload.get('azp')
    #         if azp not in ALLOWED_ORIGINS:
    #             logger.warning(f"Invalid azp: {azp}. Allowed origins: {ALLOWED_ORIGINS}")
    #             raise AuthenticationFailed("Invalid authorized party")

    #         # Get user ID
    #         user_id = cleaned_payload.get('sub')
    #         if not user_id:
    #             raise AuthenticationFailed("No user ID in token")

    #         logger.info(f"Decoded payload: {cleaned_payload}")

    #         # Get or create user
    #         try:
    #             user, created = User.objects.get_or_create(
    #                 username=user_id,
    #                 defaults={
    #                     'is_active': True,
    #                     'date_joined': datetime.datetime.fromtimestamp(
    #                         cleaned_payload.get('iat', int(time.time())),
    #                         tz=pytz.UTC
    #                     )
    #                 }
    #             )
    #             if created:
    #                 logger.info(f"Created new user with ID: {user_id}")
    #             return user
    #         except Exception as e:
    #             logger.error(f"Error creating/getting user: {str(e)}")
    #             raise AuthenticationFailed("User creation failed")

    #     except jwt.ExpiredSignatureError:
    #         logger.warning("Token expired")
    #         raise AuthenticationFailed("Token has expired.")
    #     except jwt.DecodeError as e:
    #         logger.error(f"Token decode error: {str(e)} - Token: {token}")
    #         raise AuthenticationFailed("Token decode error.")
    #     except jwt.InvalidTokenError as e:
    #         logger.error(f"Invalid token error: {str(e)}")
    #         raise AuthenticationFailed("Invalid token.")
    #     except Exception as e:
    #         logger.error(f"Unexpected error during JWT decoding: {str(e)}")
    #         raise AuthenticationFailed("Authentication failed.")


class ClerkSDK:
    def fetch_user_info(self, user_id: str):
        try:
            response = requests.get(
                f"{CLERK_API_URL}/users/{user_id}",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            )
            response.raise_for_status()
            data = response.json()
            email_address = (
                data.get("email_addresses", [{}])[0].get("email_address")
                if data.get("email_addresses")
                else f"{user_id}@example.com"
            )
            return {
                "email_address": email_address,
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "last_login": datetime.datetime.fromtimestamp(
                    data["last_sign_in_at"] / 1000, tz=pytz.UTC
                ),
            }, True
        except requests.RequestException as e:
            logger.error(f"Error fetching user info from Clerk: {str(e)}")
            return {
                "email_address": "",
                "first_name": "",
                "last_name": "",
                "last_login": None,
            }, False

    def get_jwks(self):
        jwks_data = cache.get(CACHE_KEY)
        if not jwks_data:
            try:
                logger.info(f"Fetching JWKS from URL: {CLERK_JWKS_URL}")
                response = requests.get(CLERK_JWKS_URL)
                response.raise_for_status()
                jwks_data = response.json()
                logger.info(f"JWKS response: {response.text}")
                cache.set(CACHE_KEY, jwks_data, timeout=3600)  # cache for 1 hour
            except requests.RequestException as e:
                logger.error(f"Failed to fetch JWKS: {str(e)}")
                raise AuthenticationFailed("Failed to fetch JWKS.")
            except ValueError as e:
                logger.error(f"Invalid JSON in JWKS response: {str(e)}")
                raise AuthenticationFailed("Invalid JWKS data.")
        return jwks_data
