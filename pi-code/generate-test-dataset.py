#!/usr/bin/python

from cloudant.client import Cloudant
from datetime import datetime

# cloudant credentials
USERNAME 		= "f1e0f979-add5-43b0-938c-bbbf0d1df907-bluemix"
PASSWORD 		= "417a901232b4dfda37594e720d458eb126a9bd8dc1045c28f8105ae9e8cde540"
URL 	 		= "https://f1e0f979-add5-43b0-938c-bbbf0d1df907-bluemix:417a901232b4dfda37594e720d458eb126a9bd8dc1045c28f8105ae9e8cde540@f1e0f979-add5-43b0-938c-bbbf0d1df907-bluemix.cloudant.com"
RFID_DATABASE 	= "passengers"

# create a cloudant object 
client = Cloudant(USERNAME, PASSWORD, url=URL)

# connect to cloudant client
client.connect()

# define a database
rfid_db = client[RFID_DATABASE]

count = 0
card1_locations =['17.743756,83.345006','18.0075281,83.5258691']
card2_locations =['17.779068,83.344147','18.0075281,83.5258691']
for year in xrange(2017,2018):
	
	for month in xrange(1,13):
		
		for day in xrange(1,32):

			for time in [9,10,16,17]:
				
				card_data1 = {
					'e_id' 			: '22923616767237',
					'b_id' 			: 'b1',
					'timestamp'		: float(str(year) + str(month).zfill(2) + str(day).zfill(2) +"."+ str(time).zfill(2) + '1426'),
					'location'		: card1_locations[~time%2]
				}
				
				card_data2 = {
					'e_id' 			: '646398245',
					'b_id' 			: 'b1',
					'timestamp'		: float(str(year) + str(month).zfill(2) + str(day).zfill(2) +"."+ str(time).zfill(2) + '1374'),
					'location'		: card2_locations[~time%2]
				}
				
				# print card_data

				#publishing messages
				success1 = rfid_db.create_document(card_data1)
				count += 1
				success2 = rfid_db.create_document(card_data2)
				count += 1
				# check insertion
				if success1.exists():
					print ' Data of card 1 inserted successfully.'

				if success2.exists():
					print ' Data of card 2 inserted successfully.'

				print str(count) + " documents inserted successfully "

#disconnect from cloud
client.disconnect()

