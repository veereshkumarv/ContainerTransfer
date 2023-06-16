sap.ui.define([
    "sap/m/MessageToast",
    'sap/ui/core/library'
], function(MessageToast, coreLibrary) {
    'use strict';
    var ValueState = coreLibrary.ValueState;
    return {

        handleLiveChange: function (oEvent) {
			var oTextArea = oEvent.getSource(),
				iValueLength = oTextArea.getValue().length,
				iMaxLength = oTextArea.getMaxLength(),
				sState = iValueLength > iMaxLength ? ValueState.Warning : ValueState.None;

            console.log(oTextArea)
            console.log(iValueLength)
			oTextArea.setValueState(sState);
		},

        Load: function(oEvent) {
            //MessageToast.show("Custom handler invoked.");
            var context = this.extensionAPI.getSelectedContexts();
            var element = context[0];
            var container = "";
            var wagon;
            var slot;
            var status = element.oModel.getData(element.sPath).Status;
            if (context.length > 1) {
                sap.m.MessageBox.error("Please Select 1 Entry");
            } else {
                if (element != undefined) {
                    container = element.oModel.getData(element.sPath).ContainerNumber
                    wagon = element.oModel.getData(element.sPath).WagonNumber
                    slot = element.oModel.getData(element.sPath).Slot
                }

                this._DialogGenerate = sap.ui.xmlfragment("ContainerTransfer.containertransferapp.ext.fragment.updateLoadingDialog", this);
                //console.log(sap.ui.getCore().byId("ContainerTransfer.containertransferapp::sap.suite.ui.generic.template.ListReport.view.ListReport::ZSCM_C_ContainerTransfApp--listReport").getModel())

                var headerLabel = sap.ui.getCore().byId("idUpdateLoading");
                headerLabel.setTitle("Load " + container)
                
                if(status == 'Pending') {
                    MessageToast.show("Please Stage Prior to Loading.");
                    this.onActionCancel();
                } else {
                    this.getView().addDependent(this._DialogGenerate);
                    this._DialogGenerate.open();
                }
            }
        },

        Stage: function(oEvent) {
            //MessageToast.show("Custom handler invoked.");
            var context = this.extensionAPI.getSelectedContexts();
            var element = context[0];

            if (context.length > 1) {
                sap.m.MessageBox.error("Please Select 1 Entry");
            } else {
                var location = element.oModel.getData(element.sPath).Location
                this._DialogGenerate = sap.ui.xmlfragment("ContainerTransfer.containertransferapp.ext.fragment.updateStagingDialog", this);
                var input = sap.ui.getCore().byId("locationInput");
                input.setValue(location);
                this._DialogGenerate.open();
            }
        },

        excludeContainer: function(oEvent) {
            var context = this.extensionAPI.getSelectedContexts();
            var element = context[0];
            var container = element.oModel.getData(element.sPath).ContainerNumber

            this._DialogGenerate = sap.ui.xmlfragment("ContainerTransfer.containertransferapp.ext.fragment.excludeContainerDialog", this);

            var headerLabel = sap.ui.getCore().byId("idExcludeCont");
            headerLabel.setTitle("Exclude Container " + container)

            this.getView().addDependent(this._DialogGenerate);
            this._DialogGenerate.open();
        },

        validate: function(oEvent) {
            var context = this.extensionAPI.getSelectedContexts();

            for (let i=0; i<context.length; i++) {
                var SAP_UUID = context[i].oModel.getData(context[i].sPath).SAP_UUID
                var wagon = context[i].oModel.getData(context[i].sPath).WagonNumber
                var HU = context[i].oModel.getData(context[i].sPath).HUNumber
                var check = ""
                var countErrors = 0
                wagon = context[i].oModel.getData(context[i].sPath).WagonNumber
                //console.log(wagon)
                if (wagon == "") {
                    if (countErrors > 0) {
                        check += ", "
                    }
                    check += "Wagon Number not entered"
                    countErrors += 1
                } 
                if (HU == "") {
                    if (countErrors > 0) {
                        check += ", "
                    }
                    check += "HU not found for container"
                    countErrors += 1
                } 
                if (countErrors == 0) {
                    check = "Success"
                }
                updateCheck(wagon, SAP_UUID, check, this.extensionAPI)     
            }
        },

        onActionCancel: function () {
            this._DialogGenerate.close();
            this._DialogGenerate.destroy();
            this.getView().removeDependent(this._DialogGenerate);
            this._DialogGenerate = null;
        },  

        onActionOKLoad: function (oEvent) {
            var context = this.extensionAPI.getSelectedContexts();
            var element = context[0];
            var oPromiseGet;
            var oPromiseUpsert;
            var oParameterGet = {};
            var oParameterUpsert = {};
            var container = sap.ui.getCore().byId("containerInput").getValue()
            var wagon = sap.ui.getCore().byId("wagonInput").getValue()
            var slot = sap.ui.getCore().byId("slotInput").getValue()
            var storeThis = this.extensionAPI

            if (container == "") {
                sap.ui.getCore().byId("containerInput").setValueState(sap.ui.core.ValueState.Error);  // if the field is empty after change, it will go red
            } else if (slot == "") {
                sap.ui.getCore().byId("wagonInput").setValueState(sap.ui.core.ValueState.Error);  // if the field is empty after change, it will go red
            } else if (wagon == "") {
                sap.ui.getCore().byId("slotInput").setValueState(sap.ui.core.ValueState.Error);  // if the field is empty after change, it will go red
            } else {
                var containerSelect = element.oModel.getData(element.sPath).ContainerNumber
                if (container == containerSelect) {
                    var SAP_UUID = element.oModel.getData(element.sPath).SAP_UUID
                    oParameterGet = {
                        "SAP_UUID": SAP_UUID
                    };
                    
                    oPromiseGet = storeThis.invokeActions("cds_zscm_containertransfer_def.ZSCM_C_ContainerTransfApp/ZZ1_TRAINPLANNINGREPORTAction001", [], 
                        oParameterGet);

                    oPromiseGet.then(function (r) {
                        console.log(r[0].response.data)
                        oParameterUpsert = {
                            "ID": r[0].response.data.ID,
                            "BSMNumber": r[0].response.data.BSMNumber,
                            "SalesOrder": r[0].response.data.SalesOrder,
                            "WagonNumber": wagon,
                            "ContainerLoadPad": r[0].response.data.ContainerLoadPad,
                            "ContainerNumber": r[0].response.data.ContainerNumber,
                            "SealNumber": r[0].response.data.SealNumber,
                            "Carrier": r[0].response.data.Carrier,
                            "Buyer": r[0].response.data.Buyer,
                            "Stevedore": r[0].response.data.Stevedore,
                            "ActualPackingDate": "2023-06-08T03:38:02",
                            "SAP_Description": r[0].response.data.SAP_Description,
                            "Location": r[0].response.data.Location,
                            "NetWeight": r[0].response.data.NetWeight,
                            "PRAStatus": r[0].response.data.PRAStatus,
                            "Slot": slot,
                            "Status": r[0].response.data.Status,
                            "LoadingDate": "2023-06-08T03:38:02",
                            "TrainID": r[0].response.data.TrainID,
                            "CheckPost": r[0].response.data.CheckPost,
                            "ExcludedFlag": r[0].response.data.ExcludedFlag
                        };

                        oPromiseUpsert = storeThis.invokeActions("cds_zscm_containertransfer_def.ZSCM_C_ContainerTransfApp/ZZ1_TRAINPLANNINGREPORTSap_upsert", [],
                        oParameterUpsert);

                        oPromiseUpsert.then(function (r) {
                            sap.m.MessageToast.show("success");
                            sap.ui.getCore().byId("ContainerTransfer.containertransferapp::sap.suite.ui.generic.template.ListReport.view.ListReport::ZSCM_C_ContainerTransfApp--listReport").getModel().refresh(true);

                        });
                        oPromiseUpsert.catch(function (r) {
                            var E = jQuery.parseJSON(r[0].error.response.responseText);
                            sap.m.MessageBox.error(E.error.message.value);
                        });
                        
                    });
                    oPromiseGet.catch(function (r) {
                        var E = jQuery.parseJSON(r[0].error.response.responseText);
                        sap.m.MessageBox.error(E.error.message.value);
                    });
                
                    this.onActionCancel();

                } else {
                    sap.m.MessageBox.error("Scanned Container Does Not Match Selected");
                }
        }

        },

        onActionOKStage: function (oEvent) {
            var context = this.extensionAPI.getSelectedContexts();
            var element = context[0];
            var SAP_UUID = element.oModel.getData(element.sPath).SAP_UUID
            console.log(SAP_UUID)
            var oPromiseGet;
            var oPromiseUpsert;
            var oParameterGet = {};
            var oParameterUpsert = {};
            var location = sap.ui.getCore().byId("locationInput").getValue()
            var storeThis = this.extensionAPI
            console.log(location)
            oParameterGet = {
                "SAP_UUID": SAP_UUID
            };
            
            oPromiseGet = storeThis.invokeActions("cds_zscm_containertransfer_def.ZSCM_C_ContainerTransfApp/ZZ1_TRAINPLANNINGREPORTAction001", [], 
                oParameterGet);

            oPromiseGet.then(function (r) {
                console.log(r[0].response.data)

                oParameterUpsert = {
                    "ID": r[0].response.data.ID,
                    "BSMNumber": r[0].response.data.BSMNumber,
                    "SalesOrder": r[0].response.data.SalesOrder,
                    "WagonNumber": r[0].response.data.WagonNumber,
                    "ContainerLoadPad": r[0].response.data.ContainerLoadPad,
                    "ContainerNumber": r[0].response.data.ContainerNumber,
                    "SealNumber": r[0].response.data.SealNumber,
                    "Carrier": r[0].response.data.Carrier,
                    "Buyer": r[0].response.data.Buyer,
                    "Stevedore": r[0].response.data.Stevedore,
                    "ActualPackingDate": "2023-06-08T03:38:02",
                    "SAP_Description": r[0].response.data.SAP_Description,
                    "Location": location,
                    "NetWeight": r[0].response.data.NetWeight,
                    "PRAStatus": r[0].response.data.PRAStatus,
                    "Slot": r[0].response.data.Slot,
                    "Status": r[0].response.data.Status,
                    "LoadingDate": "2023-06-08T03:38:02",
                    "TrainID": r[0].response.data.TrainID,
                    "CheckPost": r[0].response.data.CheckPost,
                    "ExcludedFlag": r[0].response.data.ExcludedFlag
                };
                console.log(this)
                oPromiseUpsert = storeThis.invokeActions("cds_zscm_containertransfer_def.ZSCM_C_ContainerTransfApp/ZZ1_TRAINPLANNINGREPORTSap_upsert" , [],
                oParameterUpsert);

                oPromiseUpsert.then(function (r) {
                    sap.m.MessageToast.show("success");
                    sap.ui.getCore().byId("ContainerTransfer.containertransferapp::sap.suite.ui.generic.template.ListReport.view.ListReport::ZSCM_C_ContainerTransfApp--listReport").getModel().refresh(true);

                });
                oPromiseUpsert.catch(function (r) {
                    var E = jQuery.parseJSON(r[0].error.response.responseText);
                    sap.m.MessageBox.error(E.error.message.value);
                });

            });
            oPromiseGet.catch(function (r) {
                var E = jQuery.parseJSON(r[0].error.response.responseText);
                sap.m.MessageBox.error(E.error.message.value);
            });
    
            this.onActionCancel();
        },
        
        onActionOKExcludeCont: function (oEvent) {
            // var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZSCM_CONTAINERTRANSF_SRV");
            // console.log(oModel.read("/ZSCM_I_Conatiner_L1"))
            // console.log(this.getOwnerComponent().getModel());
            var oPromiseGet;
            var oPromiseUpsert;
            var oParameterGet = {};
            var oParameterUpsert = {};
            var context = this.extensionAPI.getSelectedContexts();
            var element = context[0];
            var SAP_UUID = element.oModel.getData(element.sPath).SAP_UUID;
            var extensionAPI = this.extensionAPI
            var container = sap.ui.getCore().byId("contExcludeInput").getValue()
            var reason = sap.ui.getCore().byId("excludeReasonID").getValue()

            if (container == "") {
                sap.ui.getCore().byId("contExcludeInput").setValueState(sap.ui.core.ValueState.Error);  // if the field is empty after change, it will go red
            } else if (reason == "") {
                sap.ui.getCore().byId("excludeReasonID").setValueState(sap.ui.core.ValueState.Error);  // if the field is empty after change, it will go red
            } else {

                oParameterGet = {
                    "SAP_UUID": SAP_UUID
                };

                oPromiseGet = this.extensionAPI.invokeActions("cds_zscm_containertransfer_def.ZSCM_C_ContainerTransfApp/ZZ1_TRAINPLANNINGREPORTAction001", [], 
                    oParameterGet);

                oPromiseGet.then(function (r) {
                    oParameterUpsert = {
                        "ID": r[0].response.data.ID,
                        "BSMNumber": r[0].response.data.BSMNumber,
                        "SalesOrder": r[0].response.data.SalesOrder,
                        "WagonNumber": r[0].response.data.WagonNumber,
                        "ContainerLoadPad": r[0].response.data.ContainerLoadPad,
                        "ContainerNumber": r[0].response.data.ContainerNumber,
                        "SealNumber": r[0].response.data.SealNumber,
                        "Carrier": r[0].response.data.Carrier,
                        "Buyer": r[0].response.data.Buyer,
                        "Stevedore": r[0].response.data.Stevedore,
                        "ActualPackingDate": r[0].response.data.ActualPackingDate,
                        "SAP_Description": r[0].response.data.SAP_Description,
                        "Location": r[0].response.data.Location,
                        "NetWeight": r[0].response.data.NetWeight,
                        "PRAStatus": r[0].response.data.PRAStatus,
                        "Slot": r[0].response.data.Slot,
                        "Status": r[0].response.data.Status,
                        "LoadingDate": r[0].response.data.LoadingDate,
                        "TrainID": r[0].response.data.TrainID,
                        "CheckPost": r[0].response.data.CheckPost,
                        "ExcludedFlag": 1
                    };

                    oPromiseUpsert = extensionAPI.invokeActions("cds_zscm_containertransfer_def.ZSCM_C_ContainerTransfApp/ZZ1_TRAINPLANNINGREPORTSap_upsert", [],
                    oParameterUpsert);

                    oPromiseUpsert.then(function (r) {
                        sap.m.MessageToast.show("Container Excluded");
                        sap.ui.getCore().byId("ContainerTransfer.containertransferapp::sap.suite.ui.generic.template.ListReport.view.ListReport::ZSCM_C_ContainerTransfApp--listReport").getModel().refresh(true);

                    });
                    oPromiseUpsert.catch(function (r) {
                        var E = jQuery.parseJSON(r[0].error.response.responseText);
                        sap.m.MessageBox.error(E.error.message.value);
                    });
                    
                });
                oPromiseGet.catch(function (r) {
                    var E = jQuery.parseJSON(r[0].error.response.responseText);
                    sap.m.MessageBox.error(E.error.message.value);
                });

                this._DialogGenerate.close();
                this._DialogGenerate.destroy();
                this.getView().removeDependent(this._DialogGenerate);
                this._DialogGenerate = null;
            }
        }

        // postTransfer: function(oEvent) {
        //     MessageToast.show("Transfer Posted");
        // },

    };
});

function updateCheck(wagon, SAP_UUID, check, extensionAPI) {
    var oPromiseGet;
    var oPromiseUpsert;
    var oParameterGet = {};
    var oParameterUpsert = {};
    console.log(extensionAPI)
    console.log("here")
    oParameterGet = {
        "SAP_UUID": SAP_UUID
    };

    oPromiseGet = extensionAPI.invokeActions("cds_zscm_containertransfer_def.ZSCM_C_ContainerTransfApp/ZZ1_TRAINPLANNINGREPORTAction001", [], 
        oParameterGet);

    oPromiseGet.then(function (r) {
        //console.log(SAP_UUID)
        //console.log(wagon)
        //console.log(check)
        //console.log(r[0].response.data.ID)
        oParameterUpsert = {
            "ID": r[0].response.data.ID,
            "BSMNumber": r[0].response.data.BSMNumber,
            "SalesOrder": r[0].response.data.SalesOrder,
            "WagonNumber": r[0].response.data.WagonNumber,
            "ContainerLoadPad": r[0].response.data.ContainerLoadPad,
            "ContainerNumber": r[0].response.data.ContainerNumber,
            "SealNumber": r[0].response.data.SealNumber,
            "Carrier": r[0].response.data.Carrier,
            "Buyer": r[0].response.data.Buyer,
            "Stevedore": r[0].response.data.Stevedore,
            "ActualPackingDate": r[0].response.data.ActualPackingDate,
            "SAP_Description": r[0].response.data.SAP_Description,
            "Location": r[0].response.data.Location,
            "NetWeight": r[0].response.data.NetWeight,
            "PRAStatus": r[0].response.data.PRAStatus,
            "Slot": r[0].response.data.Slot,
            "Status": r[0].response.data.Status,
            "LoadingDate": r[0].response.data.LoadingDate,
            "TrainID": r[0].response.data.TrainID,
            "CheckPost": check,
            "ExcludedFlag": r[0].response.data.ExcludedFlag
        };

        oPromiseUpsert = extensionAPI.invokeActions("cds_zscm_containertransfer_def.ZSCM_C_ContainerTransfApp/ZZ1_TRAINPLANNINGREPORTSap_upsert", [],
        oParameterUpsert);

        oPromiseUpsert.then(function (r) {
            sap.m.MessageToast.show("success");
            sap.ui.getCore().byId("ContainerTransfer.containertransferapp::sap.suite.ui.generic.template.ListReport.view.ListReport::ZSCM_C_ContainerTransfApp--listReport").getModel().refresh(true);

        });
        oPromiseUpsert.catch(function (r) {
            var E = jQuery.parseJSON(r[0].error.response.responseText);
            sap.m.MessageBox.error(E.error.message.value);
        });
        
    });
    oPromiseGet.catch(function (r) {
        var E = jQuery.parseJSON(r[0].error.response.responseText);
        sap.m.MessageBox.error(E.error.message.value);
    });
}