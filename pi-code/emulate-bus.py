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

#Reading device data
with open('device.json') as data_file:
    data = json.load(data_file)

# reading gps location data
location_data = ["17.803106,83.395327","17.803208,83.395112","17.803841,83.395091","17.803861,83.394758","17.803452,83.394651","17.803064,83.394522","17.802798,83.394404","17.802369,83.394243","17.801756,83.394179","17.801266,83.394007","17.800898,83.394007","17.800489,83.394286","17.800857,83.393728","17.801787,83.393535","17.802686,83.393363","17.802196,83.393148","17.801440,83.393169","17.800664,83.393308","17.799888,83.393909","17.799768,83.394159","17.800085,83.395168","17.800555,83.396198","17.800126,83.396069","17.799513,83.395447","17.798880,83.394803","17.798226,83.394052","17.797286,83.393215","17.796459,83.392657","17.795437,83.391927","17.795334,83.390962","17.796070,83.390533","17.797132,83.390190","17.798062,83.389975","17.799124,83.389546","17.799308,83.388473","17.799584,83.387593","17.800228,83.387432","17.801117,83.387743","17.801812,83.388065","17.802619,83.388204","17.803436,83.387786","17.804110,83.387571","17.804794,83.388183","17.805356,83.388698","17.806316,83.388870","17.807235,83.389020","17.808154,83.389106","17.809002,83.389192","17.809799,83.389278","17.810310,83.388827","17.810514,83.388055","17.810739,83.387111","17.811066,83.386092","17.811352,83.385030","17.811740,83.384300","17.812097,83.383581","17.812329,83.382583","17.812630,83.381312","17.812630,83.381312","17.813115,83.379692","17.813268,83.379113","17.813472,83.378654","17.814449,83.379609","17.816400,83.380553","17.818239,83.381497","17.819873,83.382548","17.821221,83.383449","17.822140,83.381915","17.822957,83.380392","17.824091,83.378826","17.824704,83.377206","17.825358,83.375296","17.825910,83.373451","17.826666,83.371327","17.828361,83.370340","17.829730,83.368924","17.830894,83.367100","17.832263,83.365169","17.833356,83.363238","17.834520,83.361543","17.835480,83.360084","17.836215,83.358968","17.837678,83.358776","17.841886,83.358594","17.844409,83.358776","17.849434,83.360997","17.852763,83.361898","17.856623,83.363293","17.861484,83.364259","17.865446,83.364838","17.867774,83.365782","17.867774,83.365782","17.869111,83.367782","17.871429,83.370282","17.873808,83.371548","17.875973,83.372503","17.878056,83.373780","17.879884,83.374842","17.882324,83.376151","17.884335,83.377224","17.885570,83.377932","17.887755,83.378136","17.890359,83.378179","17.892575,83.378072","17.894699,83.378093","17.897405,83.378554","17.898998,83.380764","17.898957,83.383124","17.898273,83.386150","17.899059,83.389025","17.900182,83.392608","17.900948,83.395076","17.902000,83.398434","17.902674,83.400564","17.903409,83.402908","17.904991,83.407489","17.906073,83.409206","17.907564,83.410719","17.908422,83.411363","17.909545,83.411846","17.908559,83.411452","17.910887,83.412503","17.913909,83.413758","17.916931,83.415013","17.919606,83.416644","17.921688,83.418446","17.924199,83.420570","17.926680,83.422555","17.929661,83.423885","17.932050,83.423391","17.934439,83.422661","17.937379,83.421889","17.940298,83.421009","17.942942,83.420172","17.945209,83.419142","17.947753,83.418123","17.949116,83.417715","17.951152,83.417157","17.955393,83.417071","17.959674,83.418058","17.962185,83.419946","17.963695,83.422950","17.963807,83.426909","17.964746,83.431630","17.966910,83.434677","17.969910,83.437767","17.972747,83.440857","17.977752,83.446865","17.979875,83.449590","17.982263,83.452691","17.984875,83.456264","17.986855,83.459568","17.988610,83.463817","17.990916,83.467261","17.993314,83.470029","17.996089,83.472797","17.998691,83.474900","18.001701,83.477067","18.007073,83.480757","18.010093,83.482699","18.012533,83.483858","18.016768,83.485317","18.018641,83.485746","18.021192,83.486626","18.023702,83.488611","18.025763,83.490220","18.027941,83.492323","18.029451,83.495370","18.030614,83.498674","18.031634,83.500444","18.030966,83.501774","18.029224,83.501409","18.027347,83.501463","18.026102,83.504853","18.024266,83.506140","18.022368,83.507556","18.022103,83.510056","18.021164,83.511826","18.020491,83.513628","18.019787,83.515345","18.018603,83.514508","18.017011,83.514014","18.015409,83.515613","18.014572,83.517845","18.014164,83.520205","18.013664,83.522394","18.008731,83.524111","18.005629,83.524969","18.002558,83.524679","18.000456,83.523971"]


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


print " Bus Started "
# This loop keeps checking continues to scan Tags. 
for location in location_data:

	# give a gap
	time.sleep(5)
	# prepare timestamp
	current_date = str(datetime.now().year) +str(datetime.now().month).zfill(2) +str(datetime.now().day).zfill(2)
	current_time = str(datetime.now().hour).zfill(2) +str(datetime.now().minute).zfill(2) +str(datetime.now().second).zfill(2)
	bus_timestamp= current_date +"."+ current_time
	bus_status = {
		'b_id'		   : 'b1',
		'bus_location' : location,
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
		timestamp=swiped_date+"."+swiped_time
		
		# swiping location is static for now, adjust if GPS is enabled
		# swiped_location= '1234.1234,5678.5678'

		#json file to send
		card_data = {
				'e_id' : tagid,
				'b_id' : 'b1',
				'location' : location,
				'timestamp' : float(timestamp)
			}
		
		print card_data

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

print "Bus reached Miracle Software Systems Road"