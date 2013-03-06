from setuptools import setup, find_packages

setup(
    name='spotted-director',
    version='0.1',
    # packages=[''],
    url='https://github.com/rshk/spotted-director',
    license='GPLv3+',
    author='Samuele Santi',
    author_email='redshadow@hackzine.org',
    description='SpottedWall director',
    # scripts=['spotted-director.py'],
    packages=find_packages(),
    install_requires=[
        'zerorpc',
        'pyzmq<13',  # Version 13 is known not to work
        'flask',
    ],
    package_data={'': ['README.rst']},
    entry_points={
        'console_scripts': [
            'spotted_director = spotted_director:main',
        ],
    },
    include_package_data=True,
    zip_safe=False,
)
