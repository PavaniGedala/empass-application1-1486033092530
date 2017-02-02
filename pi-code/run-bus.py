#librarys
import RPi.GPIO as GPIO
import time
import MFRC522
import signal
import time
import sys
import uuid
import json
from pprint import pprint
import ibmiotf.device
from datetime import datetime
from cloudant.client import Cloudant

continue_reading = True

# cloudant credentials
USERNAME 		= "f1e0f979-add5-43b0-938c-bbbf0d1df907-bluemix"
PASSWORD 		= "417a901232b4dfda37594e720d458eb126a9bd8dc1045c28f8105ae9e8cde540"
URL 	 		= "https://f1e0f979-add5-43b0-938c-bbbf0d1df907-bluemix:417a901232b4dfda37594e720d458eb126a9bd8dc1045c28f8105ae9e8cde540@f1e0f979-add5-43b0-938c-bbbf0d1df907-bluemix.cloudant.com"

# create a cloudant object 
client = Cloudant(USERNAME, PASSWORD, url=URL)

# connect to cloudant client
client.connect()

# define a database
rfid_db = client['bus_status']

#Reading json files
with open('device.json') as data_file:
    data = json.load(data_file)


# Welcome message
print "Welcome to MEANHack'16"
print "Scan your Tag To Publish in Cloud"


# function value to abort process
def end_read(signal,frame):
	global continue_reading
	print "Ctrl+C captured, ending read."
	continue_reading = False
	GPIO.cleanup()
	#disconnect from cloudant
	client.disconnect()


# Hook the SIGINT(SIGNALS INTELLIGENCE)
signal.signal(signal.SIGINT, end_read)

# Create an object of the class MFRC522
MIFAREReader = MFRC522.MFRC522()



# This loop keeps checking continues to scan Tags. 
while continue_reading:

	# give a gap
	time.sleep(5)

	# prepare timestamp
	current_date = str(datetime.now().year) +str(datetime.now().month).zfill(2) +str(datetime.now().day).zfill(2)
	current_time = str(datetime.now().hour).zfill(2) +str(datetime.now().minute).zfill(2) +str(datetime.now().second).zfill(2)
	bus_timestamp= current_date +"."+ current_time
	bus_status = {
		'b_id'		   : 'b1',
		'bus_location' : '18.000456,83.523971',
		'bus_timestamp': float(bus_timestamp)
	}

	#publishing messages
	success = rfid_db.create_document(bus_status)
	# check insertion
	if success.exists():
			print ' Status inserted successfully.'

	# Scan for cards
	(status,TagType) = MIFAREReader.MFRC522_Request(MIFAREReader.PICC_REQIDL)

	# If a card is found
	if status == MIFAREReader.MI_OK:
		print "Card detected"

	# Get the UID of the card
	(status,uid) = MIFAREReader.MFRC522_Anticoll()
	
	# If we have the UID, continue
	if status == MIFAREReader.MI_OK:
		
		# prepare tag id values in list to a string
		tagid = ''
		for id_val in uid:
			tagid += str(id_val)

		#configure credentials
		config = data[tagid]
		
		deviceOptions = {"org": config["org"], "type": config["type"], "id": config["id"], "auth-method": config["auth-method"], "auth-token": config["auth-token"]}
		device = ibmiotf.device.Client(deviceOptions)		

		# connect to cloud
		device.connect()
		
		# prepare date 
		swiped_date = str(datetime.now().year) +str(datetime.now().month).zfill(2) +str(datetime.now().day).zfill(2)
		# prepare time
		swiped_time = str(datetime.now().hour).zfill(2) +str(datetime.now().minute).zfill(2) +str(datetime.now().second).zfill(2)
		# make timestamp
		timestamp=float(swiped_date+"."+swiped_time)
		
		# swiping location is static for now, adjust if GPS is enabled
		swiped_location= '18.000456,83.523971'

		#json file to send
		card_data = {
				'e_id' : tagid,
				'b_id' : 'b1',
				'swiped_location' : swiped_location,
				'timestamp' : timestamp
			}
		
		# print card_data

		#publishing messages
		success = device.publishEvent('tag_scan', "json", card_data, qos=0)

		print ' Card Data inserted successfully.'

		# setup light for 2 sec         
		GPIO.setmode(GPIO.BOARD)
		GPIO.setup(7,GPIO.OUT)
		GPIO.output(7,1)

		time.sleep(2)

		GPIO.output(7,0)

		#disconnect from cloud
		device.disconnect()

		print
		print 'Again Scan Your Tag To Publish data In Cloud'
		print