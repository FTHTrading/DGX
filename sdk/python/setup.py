from setuptools import setup, find_packages

setup(
    name="dgx-sdk",
    version="1.0.0",
    description="Official Python SDK for the DGX Sovereign L1 Network",
    author="FTH Trading / UnyKorn LLC",
    packages=find_packages(),
    install_requires=["requests>=2.28.0"],
    python_requires=">=3.9",
)
