from storages.backends.azure_storage import AzureStorage
from decouple import config
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import AzureError
import time

class AzureMediaStorage(AzureStorage):
    account_name = config("AZURE_ACCOUNT_NAME")
    account_key = config("AZURE_ACCOUNT_KEY")
    azure_container = config("AZURE_CONTAINER")
    expiration_secs = 500  # O usa un número si necesitas URLs temporales
    
    # Add timeout and chunk size configurations
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.connection_timeout = 300  # 5 minutes timeout
        self.read_timeout = 300
        self.max_block_size = 4 * 1024 * 1024  # 4MB chunks
        self.max_single_put_size = 64 * 1024 * 1024  # 64MB
        self.max_retries = 3
        self.retry_delay = 5  # seconds

    def _save(self, name, content):
        retries = 0
        while retries < self.max_retries:
            try:
                return super()._save(name, content)
            except AzureError as e:
                if "OperationTimedOut" in str(e) and retries < self.max_retries - 1:
                    retries += 1
                    time.sleep(self.retry_delay)
                    continue
                raise